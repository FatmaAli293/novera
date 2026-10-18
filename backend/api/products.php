<?php
require_once __DIR__ . '/../config/db.php';

// products.php?id=3  -> one product
if (isset($_GET['id'])) {
    $stmt = $pdo->prepare("SELECT * FROM Products WHERE product_id = ? AND is_active = 1");
    $stmt->execute([(int)$_GET['id']]);
    $product = $stmt->fetch();
    if (!$product) {
        respond(['error' => 'Product not found'], 404);
    }
    respond($product);
}

// products.php?category_id=2  -> products of one category
if (isset($_GET['category_id'])) {
    $stmt = $pdo->prepare("SELECT * FROM Products WHERE category_id = ? AND is_active = 1 ORDER BY product_id");
    $stmt->execute([(int)$_GET['category_id']]);
    respond($stmt->fetchAll());
}

// products.php  -> all products
$stmt = $pdo->query("SELECT * FROM Products WHERE is_active = 1 ORDER BY product_id");
respond($stmt->fetchAll());