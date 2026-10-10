<?php
/**
 * BookmarkSyncService.php
 * คลาสสำหรับจัดการบุ๊กมาร์กใน Local MySQL และ Sync ไปยัง Supabase (user_bookmarks)
 * ใช้งานร่วมกับ http://localhost:81/PHP-source-nearby/admin/bookmarks
 */

class BookmarkSyncService
{
    private $pdo;
    private $supabaseUrl;
    private $supabaseKey;

    public function __construct(PDO $pdo, string $supabaseUrl, string $supabaseKey)
    {
        $this->pdo = $pdo;
        $this->supabaseUrl = rtrim($supabaseUrl, '/');
        $this->supabaseKey = $supabaseKey;
    }

    /**
     * 1. บันทึกบุ๊กมาร์กลง MySQL ในเครื่อง (Local) ก่อน
     */
    public function saveBookmarkLocal(array $data): int
    {
        $sql = "INSERT INTO `bookmarks` 
                (`device_id`, `article_id`, `title`, `link`, `description`, `content`, `image_url`, `author`, `source`, `category`, `published_millis`, `reading_time`, `images_json`, `sync_status`)
                VALUES 
                (:device_id, :article_id, :title, :link, :description, :content, :image_url, :author, :source, :category, :published_millis, :reading_time, :images_json, 'pending')
                ON DUPLICATE KEY UPDATE 
                `title` = VALUES(`title`),
                `link` = VALUES(`link`),
                `description` = VALUES(`description`),
                `content` = VALUES(`content`),
                `image_url` = VALUES(`image_url`),
                `sync_status` = 'pending',
                `updated_at` = NOW()";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            ':device_id' => $data['device_id'] ?? 'admin-web',
            ':article_id' => $data['article_id'],
            ':title' => $data['title'],
            ':link' => $data['link'],
            ':description' => $data['description'] ?? null,
            ':content' => $data['content'] ?? null,
            ':image_url' => $data['image_url'] ?? null,
            ':author' => $data['author'] ?? null,
            ':source' => $data['source'] ?? null,
            ':category' => $data['category'] ?? null,
            ':published_millis' => !empty($data['published_millis']) ? (int)$data['published_millis'] : null,
            ':reading_time' => !empty($data['reading_time']) ? (int)$data['reading_time'] : 1,
            ':images_json' => !empty($data['images']) ? (is_array($data['images']) ? json_encode($data['images']) : $data['images']) : null,
        ]);

        return (int)$this->pdo->lastInsertId();
    }

    /**
     * 2. ส่งบุ๊กมาร์กจาก MySQL ไปยัง Supabase (user_bookmarks)
     */
    public function syncSingleToSupabase(int $bookmarkId): array
    {
        // ดึงข้อมูลจาก MySQL
        $stmt = $this->pdo->prepare("SELECT * FROM `bookmarks` WHERE `id` = :id LIMIT 1");
        $stmt->execute([':id' => $bookmarkId]);
        $bm = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$bm) {
            return ['success' => false, 'error' => 'Bookmark not found in database'];
        }

        // เตรียม Payload สำหรับ Supabase
        $payload = [
            'device_id' => $bm['device_id'],
            'article_id' => $bm['article_id'],
            'title' => $bm['title'],
            'link' => $bm['link'],
            'description' => $bm['description'],
            'content' => $bm['content'],
            'image_url' => $bm['image_url'],
            'author' => $bm['author'],
            'source' => $bm['source'],
            'category' => $bm['category'],
            'published_millis' => !empty($bm['published_millis']) ? (int)$bm['published_millis'] : null,
            'reading_time' => (int)($bm['reading_time'] ?: 1),
            'images' => !empty($bm['images_json']) ? json_decode($bm['images_json'], true) : [],
            'updated_at' => date('c'),
        ];

        // ยิง REST API Upsert ไปยัง Supabase
        $url = $this->supabaseUrl . '/rest/v1/user_bookmarks';
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'POST');
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([$payload]));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'apikey: ' . $this->supabaseKey,
            'Authorization: Bearer ' . $this->supabaseKey,
            'Content-Type: application/json',
            'Prefer: resolution=merge-duplicates,return=representation'
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($httpCode >= 200 && $httpCode < 300) {
            $respData = json_decode($response, true);
            $supabaseId = (!empty($respData) && is_array($respData) && isset($respData[0]['id'])) 
                ? $respData[0]['id'] 
                : null;

            // อัปเดตสถานะใน MySQL เป็น synced
            $upStmt = $this->pdo->prepare("UPDATE `bookmarks` 
                SET `sync_status` = 'synced', 
                    `supabase_id` = COALESCE(:supa_id, `supabase_id`), 
                    `synced_at` = NOW(), 
                    `sync_error` = NULL 
                WHERE `id` = :id");
            $upStmt->execute([':supa_id' => $supabaseId, ':id' => $bookmarkId]);

            return ['success' => true, 'status' => 'synced', 'supabase_id' => $supabaseId];
        } else {
            // อัปเดตสถานะใน MySQL เป็น failed พร้อมข้อความ error
            $errMsg = $curlError ?: ($response ?: "HTTP Error $httpCode");
            $upStmt = $this->pdo->prepare("UPDATE `bookmarks` 
                SET `sync_status` = 'failed', 
                    `sync_error` = :err 
                WHERE `id` = :id");
            $upStmt->execute([':err' => substr($errMsg, 0, 500), ':id' => $bookmarkId]);

            return ['success' => false, 'status' => 'failed', 'error' => $errMsg];
        }
    }

    /**
     * 3. ซิงค์บุ๊กมาร์กทั้งหมดที่ยังค้าง (pending หรือ failed) ขึ้น Supabase
     */
    public function syncPendingToSupabase(): array
    {
        $stmt = $this->pdo->query("SELECT `id` FROM `bookmarks` WHERE `sync_status` IN ('pending', 'failed') ORDER BY `id` ASC LIMIT 50");
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $successCount = 0;
        $failedCount = 0;

        foreach ($rows as $row) {
            $res = $this->syncSingleToSupabase((int)$row['id']);
            if ($res['success']) {
                $successCount++;
            } else {
                $failedCount++;
            }
        }

        return [
            'total_processed' => count($rows),
            'success_count' => $successCount,
            'failed_count' => $failedCount,
        ];
    }

    /**
     * 4. ดึงข้อมูล (Pull) บุ๊กมาร์กจาก Supabase ลงมาเก็บใน Local MySQL
     */
    public function pullFromSupabase(): array
    {
        $url = $this->supabaseUrl . '/rest/v1/user_bookmarks?select=*&order=created_at.desc&limit=100';
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'apikey: ' . $this->supabaseKey,
            'Authorization: Bearer ' . $this->supabaseKey,
            'Content-Type: application/json'
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode < 200 || $httpCode >= 300) {
            return ['success' => false, 'error' => "HTTP $httpCode: $response"];
        }

        $items = json_decode($response, true);
        if (!is_array($items)) {
            return ['success' => false, 'error' => 'Invalid JSON response from Supabase'];
        }

        $imported = 0;
        $sql = "INSERT INTO `bookmarks` 
                (`supabase_id`, `device_id`, `article_id`, `title`, `link`, `description`, `content`, `image_url`, `author`, `source`, `category`, `published_millis`, `reading_time`, `images_json`, `sync_status`, `synced_at`, `created_at`)
                VALUES 
                (:supa_id, :device_id, :article_id, :title, :link, :description, :content, :image_url, :author, :source, :category, :published_millis, :reading_time, :images_json, 'synced', NOW(), :created_at)
                ON DUPLICATE KEY UPDATE 
                `supabase_id` = VALUES(`supabase_id`),
                `title` = VALUES(`title`),
                `sync_status` = 'synced',
                `synced_at` = NOW()";

        $stmt = $this->pdo->prepare($sql);

        foreach ($items as $item) {
            $stmt->execute([
                ':supa_id' => $item['id'] ?? null,
                ':device_id' => $item['device_id'] ?? 'unknown',
                ':article_id' => $item['article_id'] ?? '',
                ':title' => $item['title'] ?? 'No Title',
                ':link' => $item['link'] ?? '',
                ':description' => $item['description'] ?? null,
                ':content' => $item['content'] ?? null,
                ':image_url' => $item['image_url'] ?? null,
                ':author' => $item['author'] ?? null,
                ':source' => $item['source'] ?? null,
                ':category' => $item['category'] ?? null,
                ':published_millis' => !empty($item['published_millis']) ? (int)$item['published_millis'] : null,
                ':reading_time' => (int)($item['reading_time'] ?? 1),
                ':images_json' => !empty($item['images']) ? json_encode($item['images']) : null,
                ':created_at' => !empty($item['created_at']) ? date('Y-m-d H:i:s', strtotime($item['created_at'])) : date('Y-m-d H:i:s'),
            ]);
            $imported++;
        }

        return ['success' => true, 'imported_count' => $imported];
    }
}
