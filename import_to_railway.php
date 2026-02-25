<?php
// Import SQL to Railway MySQL
$host = 'centerbeam.proxy.rlwy.net';
$port = 24084;
$user = 'root';
$pass = 'SUUCxuUzkJhJhbQVJIksaUcHocCzFREi';
$db   = 'railway';

$sqlFile = __DIR__ . '/dbumkm (3).sql';

echo "Connecting to Railway MySQL...\n";

try {
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$db;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::MYSQL_ATTR_LOCAL_INFILE => true,
    ]);
    echo "Connected successfully!\n";
} catch (PDOException $e) {
    die("Connection failed: " . $e->getMessage() . "\n");
}

echo "Reading SQL file...\n";
$sql = file_get_contents($sqlFile);

if (!$sql) {
    die("Could not read SQL file: $sqlFile\n");
}

echo "File size: " . strlen($sql) . " bytes\n";
echo "Importing... (this may take a moment)\n";

try {
    // Split by semicolons but be careful with strings
    $pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, 0);
    
    // Execute the entire SQL file
    $pdo->exec($sql);
    
    echo "\n✅ Import completed successfully!\n";
    
    // Show tables to verify
    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    echo "\nTables in database (" . count($tables) . " total):\n";
    foreach ($tables as $table) {
        $count = $pdo->query("SELECT COUNT(*) FROM `$table`")->fetchColumn();
        echo "  - $table ($count rows)\n";
    }
    
} catch (PDOException $e) {
    echo "Error during import: " . $e->getMessage() . "\n";
    echo "Trying line-by-line import...\n";
    
    // Fallback: split and execute one by one
    $statements = array_filter(array_map('trim', explode(';', $sql)));
    $total = count($statements);
    $success = 0;
    $errors = 0;
    
    foreach ($statements as $i => $stmt) {
        if (empty($stmt) || $stmt === '--') continue;
        try {
            $pdo->exec($stmt);
            $success++;
        } catch (PDOException $e2) {
            $errors++;
            if ($errors <= 5) {
                echo "  Warning: " . substr($e2->getMessage(), 0, 100) . "\n";
            }
        }
        
        // Progress
        if (($i + 1) % 50 === 0) {
            echo "  Progress: " . ($i + 1) . "/$total statements...\n";
        }
    }
    
    echo "\n✅ Import finished! Success: $success, Errors: $errors\n";
    
    // Show tables
    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    echo "\nTables in database (" . count($tables) . " total):\n";
    foreach ($tables as $table) {
        try {
            $count = $pdo->query("SELECT COUNT(*) FROM `$table`")->fetchColumn();
            echo "  - $table ($count rows)\n";
        } catch (Exception $e) {
            echo "  - $table (error counting)\n";
        }
    }
}

echo "\nDone! You can now refresh your website.\n";
