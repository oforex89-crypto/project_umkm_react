<?php
// Verify Railway database after cleanup
$host = 'centerbeam.proxy.rlwy.net';
$port = 24084;
$user = 'root';
$pass = 'SUUCxuUzkJhJhbQVJIksaUcHocCzFREi';
$db   = 'railway';

$output = "";
try {
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$db;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);

    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    $output .= "=== RAILWAY DB STATUS ===\n";
    foreach ($tables as $table) {
        $count = $pdo->query("SELECT COUNT(*) FROM `$table`")->fetchColumn();
        $output .= "  $table: $count rows\n";
    }

    $output .= "\n=== REMAINING USERS ===\n";
    $users = $pdo->query("SELECT id, name, email, role FROM users")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($users as $u) {
        $output .= "  ID:{$u['id']} | {$u['name']} | {$u['email']} | {$u['role']}\n";
    }

    file_put_contents(__DIR__ . '/railway_status.txt', $output);
    echo "Saved to railway_status.txt\n";

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
