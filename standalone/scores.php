<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

$file = __DIR__ . '/scores.json';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) { http_response_code(400); echo '{"error":"bad input"}'; exit; }

    $name  = mb_substr(trim($input['name']  ?? ''), 0, 30);
    if ($name === '') $name = 'Névtelen';
    $board = intval($input['board'] ?? 0);
    $time  = intval($input['time']  ?? 0);
    $moves = intval($input['moves'] ?? 0);

    if ($board < 1 || $board > 6 || $time < 1 || $time > 99999) {
        http_response_code(400);
        echo '{"error":"invalid data"}';
        exit;
    }

    $fp = fopen($file, 'c+');
    if (!$fp) { http_response_code(500); echo '{"error":"cannot open scores file"}'; exit; }
    flock($fp, LOCK_EX);

    $raw    = stream_get_contents($fp);
    $scores = ($raw && strlen($raw) > 2) ? json_decode($raw, true) : [];
    if (!is_array($scores)) $scores = [];

    $scores[] = [
        'name'  => $name,
        'board' => $board,
        'time'  => $time,
        'moves' => $moves,
        'date'  => date('Y-m-d'),
    ];

    // Keep top 200 per board to avoid unbounded file growth
    $byBoard = [];
    foreach ($scores as $s) {
        $byBoard[$s['board']][] = $s;
    }
    $scores = [];
    foreach ($byBoard as $list) {
        usort($list, fn($a, $b) => $a['time'] - $b['time']);
        $scores = array_merge($scores, array_slice($list, 0, 200));
    }

    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, json_encode($scores, JSON_UNESCAPED_UNICODE));
    flock($fp, LOCK_UN);
    fclose($fp);

    echo json_encode(['ok' => true]);

} else {
    // GET — return top 10 for a board (or all boards if board=0)
    $board = intval($_GET['board'] ?? 0);

    if (!file_exists($file)) { echo '[]'; exit; }
    $scores = json_decode(file_get_contents($file), true);
    if (!is_array($scores)) { echo '[]'; exit; }

    if ($board > 0) {
        $scores = array_values(array_filter($scores, fn($s) => $s['board'] === $board));
    }
    usort($scores, fn($a, $b) => $a['time'] - $b['time']);
    echo json_encode(array_slice($scores, 0, 10), JSON_UNESCAPED_UNICODE);
}
