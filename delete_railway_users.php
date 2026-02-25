<?php
// Clean Railway database - keep only admin, delete everything else
$host = 'centerbeam.proxy.rlwy.net';
$port = 24084;
$user = 'root';
$pass = 'SUUCxuUzkJhJhbQVJIksaUcHocCzFREi';
$db   = 'railway';

try {
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$db;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);
    echo "Connected to Railway!\n\n";

    // Disable foreign key checks
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");

    // Show what we're keeping
    $admin = $pdo->query("SELECT id, name, email, role FROM users WHERE role = 'admin'")->fetchAll(PDO::FETCH_ASSOC);
    echo "=== KEEPING (Admin) ===\n";
    foreach ($admin as $a) {
        echo "  ID:{$a['id']} | {$a['name']} | {$a['email']} | {$a['role']}\n";
    }

    // Show tables and current row counts
    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    echo "\n=== BEFORE CLEANUP ===\n";
    foreach ($tables as $table) {
        $count = $pdo->query("SELECT COUNT(*) FROM `$table`")->fetchColumn();
        echo "  $table: $count rows\n";
    }

    // Tables to fully truncate (all data removed)
    $truncateTables = [
        'order_items',
        'orders',
        'tproduk',
        'tumkm',
        'event_participants',
        'events',
        'gift_packages',
        'gift_package_products',
        'notifications',
        'sessions',
        'cache',
        'cache_locks',
        'jobs',
        'failed_jobs',
    ];

    echo "\n=== CLEANING ===\n";

    // Truncate related tables
    foreach ($truncateTables as $table) {
        try {
            $count = $pdo->query("SELECT COUNT(*) FROM `$table`")->fetchColumn();
            $pdo->exec("TRUNCATE TABLE `$table`");
            echo "  ✅ Truncated `$table` ($count rows deleted)\n";
        } catch (PDOException $e) {
            // Table might not exist
            echo "  ⚠️ Skipped `$table`: " . $e->getMessage() . "\n";
        }
    }

    // Delete non-admin users
    $nonAdminCount = $pdo->query("SELECT COUNT(*) FROM users WHERE role != 'admin'")->fetchColumn();
    $pdo->exec("DELETE FROM users WHERE role != 'admin'");
    echo "  ✅ Deleted $nonAdminCount non-admin users\n";

    // Re-enable foreign key checks
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");

    // Show final state
    echo "\n=== AFTER CLEANUP ===\n";
    foreach ($tables as $table) {
        try {
            $count = $pdo->query("SELECT COUNT(*) FROM `$table`")->fetchColumn();
            echo "  $table: $count rows\n";
        } catch (Exception $e) {
            echo "  $table: error\n";
        }
    }

    $remainingUsers = $pdo->query("SELECT id, name, email, role FROM users")->fetchAll(PDO::FETCH_ASSOC);
    echo "\n=== REMAINING USERS ===\n";
    foreach ($remainingUsers as $u) {
        echo "  ID:{$u['id']} | {$u['name']} | {$u['email']} | {$u['role']}\n";
    }

    echo "\n✅ Cleanup complete! Only admin remains.\n";

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
