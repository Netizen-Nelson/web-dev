<?php
/**
 * submit-answer.php
 * ─────────────────────────────────────────────────────────────
 * 接收 <answer-sheet> / <fill-sheet> 元件送出的 JSON，
 * 寫入資料庫並回傳結果。
 *
 * 前端 Content-Type: application/json（POST）
 *
 * 回傳格式：
 *   成功  → { "ok": true,  "id": 123 }
 *   含答案 → { "ok": true,  "id": 123, "answers": {"1":"b", ...} }
 *   失敗  → { "ok": false, "error": "..." }
 *
 * PHP 最低版本：8.1
 */

declare(strict_types=1);

// ══════════════════════════════════════════════════════════════
//  ★ 兩個常數：依專案修改這兩行即可
// ══════════════════════════════════════════════════════════════
const TABLE_PREFIX = 'myapp_';             // 資料表前綴
const TABLE_NAME   = 'answer_submissions'; // 不含前綴的資料表名稱

// ══════════════════════════════════════════════════════════════
//  資料庫連線（單一 PDO）
//  ★ 填入您的連線資訊
// ══════════════════════════════════════════════════════════════
function getPdo(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        $pdo = new PDO(
            dsn: 'mysql:host=localhost;dbname=YOUR_DB;charset=utf8mb4',
            username: 'YOUR_USER',
            password: 'YOUR_PASSWORD',
            options: [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]
        );
        $pdo->exec("SET time_zone = '+08:00'");
    }
    return $pdo;
}

// ══════════════════════════════════════════════════════════════
//  自動建立資料表（只需傳入 $pdo）
//  ─────────────────────────────────────────────────────────────
//  呼叫範例：createAnswerTable(getPdo());
//
//  欄位說明：
//    exam_id      — 試卷編號（由後端 src JSON 或前端屬性傳入）
//    note1        — 備註欄 1（建議存作答者 ID）
//    note2        — 備註欄 2（建議存 session / 班級等）
//    filename     — 前端 submit-filename 屬性
//    submitted_at — 前端帶入的作答完成時間（轉為 +08:00）
//    total        — 題目總數
//    answered     — 已作答題數
//    unanswered   — 未作答題號陣列（JSON）
//    answers      — 作答結果 {"題號":"選項"} （JSON）
//    ip           — 提交者 IP
//    created_at   — 伺服器收到時間（自動填入 NOW()）
// ══════════════════════════════════════════════════════════════
function createAnswerTable(PDO $pdo): void
{
    $table = TABLE_PREFIX . TABLE_NAME;
    $pdo->exec(<<<SQL
        CREATE TABLE IF NOT EXISTS `{$table}` (
            `id`           INT UNSIGNED      NOT NULL AUTO_INCREMENT,
            `exam_id`      VARCHAR(100)      NOT NULL DEFAULT '',
            `note1`        VARCHAR(255)      NOT NULL DEFAULT '',
            `note2`        VARCHAR(255)      NOT NULL DEFAULT '',
            `filename`     VARCHAR(100)      NOT NULL DEFAULT '',
            `submitted_at` DATETIME          NULL
                           COMMENT '前端帶入的作答時間 (Asia/Taipei)',
            `total`        SMALLINT UNSIGNED NOT NULL DEFAULT 0,
            `answered`     SMALLINT UNSIGNED NOT NULL DEFAULT 0,
            `unanswered`   JSON              NOT NULL
                           COMMENT '未作答題號陣列 [3,7,...]',
            `answers`      JSON              NOT NULL
                           COMMENT '作答結果 {"1":"b","2":"a",...}',
            `ip`           VARCHAR(45)       NOT NULL DEFAULT ''
                           COMMENT '提交者 IP（支援 IPv6）',
            `created_at`   DATETIME          NOT NULL
                           COMMENT '伺服器收到時間',
            PRIMARY KEY (`id`),
            KEY `idx_exam_id` (`exam_id`),
            KEY `idx_note1`   (`note1`),
            KEY `idx_created` (`created_at`)
        ) ENGINE=InnoDB
          DEFAULT CHARSET=utf8mb4
          COLLATE=utf8mb4_unicode_ci
          COMMENT='答案卷提交紀錄'
    SQL);
}

// ══════════════════════════════════════════════════════════════
//  工具函式
// ══════════════════════════════════════════════════════════════

/** 輸出 JSON 後中止，函式不會返回 */
function jsonOut(array $payload, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/** ISO 8601 字串 → MySQL DATETIME（+08:00），格式有誤回傳 null */
function parseSubmittedAt(?string $iso): ?string
{
    if (empty($iso)) {
        return null;
    }
    try {
        return (new DateTimeImmutable($iso))
            ->setTimezone(new DateTimeZone('+08:00'))
            ->format('Y-m-d H:i:s');
    } catch (Exception) {
        return null;
    }
}

/** 取得客戶端真實 IP（考慮反向代理；依伺服器環境調整） */
function clientIp(): string
{
    // 若有使用 CDN / 反向代理，可改為讀取 HTTP_X_FORWARDED_FOR
    return $_SERVER['REMOTE_ADDR'] ?? '';
}

// ══════════════════════════════════════════════════════════════
//  主流程
// ══════════════════════════════════════════════════════════════

// 只接受 POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonOut(['ok' => false, 'error' => 'Method Not Allowed'], 405);
}

// 解析 JSON body
$rawBody = file_get_contents('php://input');
$data    = json_decode($rawBody, true);

if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
    jsonOut(['ok' => false, 'error' => 'Invalid JSON body'], 400);
}

// 必填驗證：answers 必須是陣列且不為空
if (empty($data['answers']) || !is_array($data['answers'])) {
    jsonOut(['ok' => false, 'error' => '缺少 answers 欄位'], 400);
}

// ── 整理各欄位 ──────────────────────────────────────────────
$examId      = substr((string)($data['examId']       ?? ''), 0, 100);
$note1       = substr((string)($data['note1']        ?? ''), 0, 255);
$note2       = substr((string)($data['note2']        ?? ''), 0, 255);
$filename    = substr((string)($data['filename']     ?? ''), 0, 100);
$total       = max(0, (int)($data['total']           ?? 0));
$answered    = max(0, (int)($data['answered']        ?? 0));
$unanswered  = is_array($data['unanswered'] ?? null) ? $data['unanswered'] : [];
$answers     = $data['answers'];
$submittedAt = parseSubmittedAt($data['submittedAt'] ?? null);
$ip          = clientIp();

// ── 寫入資料庫 ──────────────────────────────────────────────
try {
    $pdo = getPdo();

    // CREATE TABLE IF NOT EXISTS（首次使用自動建表，IF NOT EXISTS 幾乎無額外開銷）
    // 若已確認資料表存在，可將此行移至一次性的 setup.php 以略微提升效能
    createAnswerTable($pdo);

    $table = TABLE_PREFIX . TABLE_NAME;

    $stmt = $pdo->prepare(<<<SQL
        INSERT INTO `{$table}`
            (exam_id, note1, note2, filename,
             submitted_at, total, answered,
             unanswered, answers, ip, created_at)
        VALUES
            (:exam_id, :note1, :note2, :filename,
             :submitted_at, :total, :answered,
             :unanswered, :answers, :ip, NOW())
    SQL);

    $stmt->execute([
        ':exam_id'      => $examId,
        ':note1'        => $note1,
        ':note2'        => $note2,
        ':filename'     => $filename,
        ':submitted_at' => $submittedAt,
        ':total'        => $total,
        ':answered'     => $answered,
        ':unanswered'   => json_encode($unanswered, JSON_UNESCAPED_UNICODE),
        ':answers'      => json_encode($answers,    JSON_UNESCAPED_UNICODE),
        ':ip'           => $ip,
    ]);

    $insertId = (int) $pdo->lastInsertId();

    // ────────────────────────────────────────────────────────
    //  選擇性：回傳答案金鑰讓前端自動批改（方案 B）
    //
    //  若您有答案金鑰系統，實作 getAnswerKey(string $examId)
    //  回傳 array|null，例如：
    //
    //  function getAnswerKey(string $examId): ?array {
    //      // 從 DB 或設定檔取得該試卷的答案金鑰
    //      // 回傳格式：["1" => "b", "2" => "c", ...]
    //      return null; // 尚未實作時回傳 null
    //  }
    //
    //  $key = getAnswerKey($examId);
    //  if ($key !== null) {
    //      jsonOut(['ok' => true, 'id' => $insertId, 'answers' => $key]);
    //  }
    // ────────────────────────────────────────────────────────

    jsonOut(['ok' => true, 'id' => $insertId]);

} catch (PDOException $e) {
    // 錯誤細節只寫 error_log，不對外揭露
    error_log('[submit-answer] PDOException: ' . $e->getMessage());
    jsonOut(['ok' => false, 'error' => 'Database error'], 500);
}
