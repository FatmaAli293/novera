<?php
require_once __DIR__ . '/../config/db.php';
session_start();

if (empty($_SESSION['user'])) {
    respond(['error' => 'Please log in.'], 401);
}
$uid = (int)$_SESSION['user']['id'];
$action = $_GET['action'] ?? 'list';
// orders.php?action=create   (POST {"items":[{"id":3,"qty":1}]})
if ($action === 'create') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(['error' => 'POST required'], 405);
    $in = json_decode(file_get_contents('php://input'), true) ?: [];
    $qty = [];
    foreach (($in['items'] ?? []) as $it) {
        $id = (int)($it['id'] ?? 0);
        if ($id > 0) $qty[$id] = ($qty[$id] ?? 0) + max(1, min(20, (int)($it['qty'] ?? 1)));
    }
    if (!$qty) respond(['error' => 'Your cart is empty.'], 422);

    $ids = array_keys($qty);
    $ph = implode(',', array_fill(0, count($ids), '?'));
    $stmt = $pdo->prepare("SELECT * FROM Products WHERE product_id IN ($ph)");
    $stmt->execute($ids);
    $rows = $stmt->fetchAll();
    if (count($rows) !== count($ids)) respond(['error' => 'Some products are no longer available.'], 422);

    try {
        $pdo->beginTransaction();
        $total = 0;
        foreach ($rows as $r) $total += $r['price'] * $qty[$r['product_id']];
        $pdo->prepare("INSERT INTO Orders (user_id, total) VALUES (?, ?)")->execute([$uid, $total]);
        $oid = (int)$pdo->lastInsertId();
        $ins = $pdo->prepare("INSERT INTO OrderItems (order_id, product_id, product_name, unit_price, quantity) VALUES (?, ?, ?, ?, ?)");
        foreach ($rows as $r) {
            $name = $r['product_name'] ?? $r['name'] ?? $r['title'] ?? ('Product #' . $r['product_id']);
            $ins->execute([$oid, $r['product_id'], $name, $r['price'], $qty[$r['product_id']]]);
        }
        $pdo->commit();
        respond(['order_id' => $oid], 201);
    }     catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        respond(['error' => 'Could not place the order.', 'detail' => $e->getMessage()], 500);
    }
}

// orders.php?action=cancel   (POST {"order_id": 5})
if ($action === 'cancel') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(['error' => 'POST required'], 405);
    $in = json_decode(file_get_contents('php://input'), true) ?: [];
    $stmt = $pdo->prepare("UPDATE Orders SET status = 'cancelled'
                           WHERE order_id = ? AND user_id = ? AND status = 'processing'");
    $stmt->execute([(int)($in['order_id'] ?? 0), $uid]);
    if ($stmt->rowCount() === 0) {
        respond(['error' => 'Only orders that are still processing can be cancelled.'], 409);
    }
    respond(['ok' => true]);
}

// orders.php  -> طلبات المستخدم الحالي فقط
$stmt = $pdo->prepare("SELECT order_id, status, total, order_date AS created_at FROM Orders WHERE user_id = ? ORDER BY order_id DESC");
$stmt->execute([$uid]);
$orders = $stmt->fetchAll();

if ($orders) {
    $ids = array_column($orders, 'order_id');
    $in = implode(',', array_fill(0, count($ids), '?'));
    $stmt = $pdo->prepare("SELECT order_id, product_name, unit_price, quantity FROM OrderItems WHERE order_id IN ($in)");
    $stmt->execute($ids);
    $items = [];
    foreach ($stmt->fetchAll() as $it) { $items[$it['order_id']][] = $it; }
    foreach ($orders as &$o) { $o['items'] = $items[$o['order_id']] ?? []; }
}
respond(['orders' => $orders]);