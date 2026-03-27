<?php
/**
 * icon-btn-api.php
 * ─────────────────────────────────────────────────────────────────────────────
 * REST API：讀取 / 更新文章反應數（讚、心情等）
 *
 * GET  ?content_id=xxx            → 回傳該內容所有反應的數量
 * POST { content_id, reaction_type, delta: 1|-1 } → 更新並回傳最新數量
 * ─────────────────────────────────────────────────────────────────────────────
 */

/* ═══════════════════════════════════════════════════
 * ① 資料庫設定（請修改此區塊）
 * ═══════════════════════════════════════════════════ */
define('IKB_DB_DSN',  'mysql:host=localhost;dbname=YOUR_DB;charset=utf8mb4');
define('IKB_DB_USER', 'YOUR_USER');
define('IKB_DB_PASS', 'YOUR_PASS');
define('IKB_TBL_PFX', 'ikb_');   // 資料表前綴，避免與同資料庫其他資料表衝突


/* ═══════════════════════════════════════════════════
 * ② HTTP Headers
 * ═══════════════════════════════════════════════════ */
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}


/* ═══════════════════════════════════════════════════
 * ③ 單一 PDO 實例（static singleton）
 * ═══════════════════════════════════════════════════ */
function ikb_pdo(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        $pdo = new PDO(IKB_DB_DSN, IKB_DB_USER, IKB_DB_PASS, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
        $pdo->exec("SET time_zone = '+08:00'");
    }
    return $pdo;
}


/* ═══════════════════════════════════════════════════
 * ④ 建立資料表（首次請求時自動執行）
 * ═══════════════════════════════════════════════════ */
function ikb_table(): string
{
    static $ready = false;
    $tbl = IKB_TBL_PFX . 'reactions';
    if (!$ready) {
        ikb_pdo()->exec("
            CREATE TABLE IF NOT EXISTS `{$tbl}` (
                `id`            BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
                `content_id`    VARCHAR(255)     NOT NULL COMMENT '文章或內容的唯一識別碼',
                `reaction_type` VARCHAR(100)     NOT NULL COMMENT 'Bootstrap icon class，如 bi-heart',
                `count`         INT UNSIGNED     NOT NULL DEFAULT 0,
                `updated_at`    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP
                                    ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (`id`),
                UNIQUE KEY `uq_content_reaction` (`content_id`, `reaction_type`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
        $ready = true;
    }
    return $tbl;
}


/* ═══════════════════════════════════════════════════
 * ⑤ 回應工具
 * ═══════════════════════════════════════════════════ */
function ok(array $payload = []): void
{
    echo json_encode(['success' => true] + $payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function fail(string $msg, int $code = 400): void
{
    http_response_code($code);
    echo json_encode(['success' => false, 'error' => $msg], JSON_UNESCAPED_UNICODE);
    exit;
}


/* ═══════════════════════════════════════════════════
 * ⑥ 主路由
 * ═══════════════════════════════════════════════════ */
try {
    $tbl    = ikb_table();
    $method = $_SERVER['REQUEST_METHOD'];

    /* ────────────────────────────────────────────────
     * GET ?content_id=xxx
     * 回傳：{ success, data: { "bi-heart": 12, ... } }
     * ──────────────────────────────────────────────── */
    if ($method === 'GET') {
        $cid = trim($_GET['content_id'] ?? '');
        if ($cid === '') fail('content_id 為必填');

        $stmt = ikb_pdo()->prepare(
            "SELECT reaction_type, count FROM `{$tbl}` WHERE content_id = ?"
        );
        $stmt->execute([$cid]);
        $rows = $stmt->fetchAll();

        $data = [];
        foreach ($rows as $r) {
            $data[$r['reaction_type']] = (int) $r['count'];
        }
        ok(['data' => $data]);
    }

    /* ────────────────────────────────────────────────
     * POST  { content_id, reaction_type, delta: 1|-1 }
     * 回傳：{ success, count: 最新數量 }
     * ──────────────────────────────────────────────── */
    if ($method === 'POST') {
        $inp = json_decode(file_get_contents('php://input'), true) ?? [];

        $cid   = trim((string) ($inp['content_id']    ?? ''));
        $rt    = trim((string) ($inp['reaction_type'] ?? ''));
        $delta = (int) ($inp['delta'] ?? 1);

        if ($cid === '')                      fail('content_id 為必填');
        if ($rt  === '')                      fail('reaction_type 為必填');
        if (!in_array($delta, [1, -1], true)) fail('delta 須為 1 或 -1');

        $pdo = ikb_pdo();

        /*
         * Upsert：
         *   新記錄 → count = max(0, delta)
         *   舊記錄 → count = max(0, count + delta)
         */
        $initVal = max(0, $delta);
        $stmt = $pdo->prepare("
            INSERT INTO `{$tbl}` (content_id, reaction_type, count)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE
                count = GREATEST(0, count + ?)
        ");
        $stmt->execute([$cid, $rt, $initVal, $delta]);

        /* 讀取最新數量回傳給前端 */
        $stmt = $pdo->prepare(
            "SELECT count FROM `{$tbl}` WHERE content_id = ? AND reaction_type = ?"
        );
        $stmt->execute([$cid, $rt]);
        $count = (int) ($stmt->fetchColumn() ?? 0);

        ok(['count' => $count]);
    }

    fail('不支援的請求方式', 405);

} catch (PDOException $e) {
    fail('資料庫錯誤：' . $e->getMessage(), 500);
} catch (Throwable $e) {
    fail('伺服器錯誤：' . $e->getMessage(), 500);
}
