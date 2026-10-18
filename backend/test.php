<?php

$host = '127.0.0.1';
$dbname = 'venora';
$username = 'venora_user';
$password = 'venora_pass';


try {
    $pdo = new PDO(
        "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
        $username,
        $password
    );

    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "Venora connected to database successfully!";
} catch (PDOException $e) {
    echo "Database connection failed: " . $e->getMessage();
}