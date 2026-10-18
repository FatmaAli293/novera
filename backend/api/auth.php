<?php
require_once __DIR__ . '/../config/db.php';

session_set_cookie_params(['httponly' => true, 'samesite' => 'Lax', 'path' => '/']);
session_start();

$action = $_GET['action'] ?? '';
$in = json_decode(file_get_contents('php://input'), true) ?: [];

if ($action === 'me') {
    respond(['user' => $_SESSION['user'] ?? null]);
}
if ($action === 'logout') {
    $_SESSION = [];
    session_destroy();
    respond(['ok' => true]);
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['error' => 'POST required'], 405);
}

$email = strtolower(trim($in['email'] ?? ''));
$pass  = (string)($in['password'] ?? '');

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(['error' => 'Please enter a valid email address.'], 422);
}

if ($action === 'register') {
    $name = trim($in['full_name'] ?? '');
    if ($name === '' || mb_strlen($name) > 120) respond(['error' => 'Please enter your full name.'], 422);
    if (strlen($pass) < 8) respond(['error' => 'Password must be at least 8 characters.'], 422);

    $stmt = $pdo->prepare("SELECT 1 FROM Users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) respond(['error' => 'This email is already registered.'], 409);

    $pdo->prepare("INSERT INTO Users (full_name, email, password_hash) VALUES (?, ?, ?)")
        ->execute([$name, $email, password_hash($pass, PASSWORD_DEFAULT)]);

    session_regenerate_id(true);
    $_SESSION['user'] = ['id' => (int)$pdo->lastInsertId(), 'name' => $name, 'email' => $email];
    respond(['user' => $_SESSION['user']], 201);
}

if ($action === 'login') {
    $stmt = $pdo->prepare("SELECT user_id, full_name, password_hash FROM Users WHERE email = ?");
    $stmt->execute([$email]);
    $u = $stmt->fetch();
    if (!$u) {
        respond(['error' => 'No account found for this email.', 'code' => 'no_account'], 404);
    }
    if (!password_verify($pass, $u['password_hash'])) {
        respond(['error' => 'Incorrect password.'], 401);
    }
    session_regenerate_id(true);
    $_SESSION['user'] = ['id' => (int)$u['user_id'], 'name' => $u['full_name'], 'email' => $email];
    respond(['user' => $_SESSION['user']]);
}

respond(['error' => 'Unknown action'], 400);