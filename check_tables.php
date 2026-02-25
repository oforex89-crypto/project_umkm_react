<?php
$host = 'centerbeam.proxy.rlwy.net';
$port = 24084;
$user = 'root';
$pass = 'SUUCxuUzkJhJhbQVJIksaUcHocCzFREi';
$db   = 'railway';

$pdo = new PDO("mysql:host=$host;port=$port;dbname=$db;charset=utf8mb4", $user, $pass);

echo "=== tadmin ===\n";
$rows = $pdo->query("SELECT * FROM tadmin")->fetchAll(PDO::FETCH_ASSOC);
foreach ($rows as $r) { print_r($r); }

echo "\n=== tacara (events) ===\n";
$rows2 = $pdo->query("SELECT id, nama_acara FROM tacara")->fetchAll(PDO::FETCH_ASSOC);
foreach ($rows2 as $r) { echo "  ID:{$r['id']} | {$r['nama_acara']}\n"; }
