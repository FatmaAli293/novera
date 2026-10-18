No<?php
require_once __DIR__ . '/../config/db.php';

$info = $pdo->query("SELECT DATABASE() AS db, @@port AS port, @@datadir AS datadir")->fetch();
$info['rows_count'] = $pdo->query("SELECT COUNT(*) FROM Categories")->fetchColumn();

respond($info);