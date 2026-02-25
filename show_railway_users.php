<?php
// Show users data from Railway database (preview only, no delete)
$host = 'centerbeam.proxy.rlwy.net';
$port = 24084;
$user = 'root';
$pass = 'SUUCxuUzkJhJhbQVJIksaUcHocCzFREi';
$db   = 'railway';

try {
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$db;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);
    echo "Connected to Railway!\n";

    $count = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
    echo "Total users: $count\n\n";

    $rows = $pdo->query("SELECT id, name, email, role FROM users")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($rows as $r) {
        echo "  ID:{$r['id']} | {$r['name']} | {$r['email']} | {$r['role']}\n";
    }

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
