<?php
header('Content-Type: application/json');
require 'config.php';

$action = $_POST['action'] ?? $_GET['action'] ?? '';

switch ($action) {
    case 'save_election':
        $title = $_POST['title'] ?? '';
        $end_password = password_hash($_POST['end_password'] ?? '', PASSWORD_DEFAULT);
        $candidates = json_decode($_POST['candidates'] ?? '[]', true);

        if (empty($title) || empty($end_password) || count($candidates) < 2) {
            echo json_encode(['success' => false, 'message' => 'Dados inválidos']);
            exit;
        }

        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare("INSERT INTO elections (title, end_password) VALUES (?, ?)");
            $stmt->execute([$title, $end_password]);
            $election_id = $pdo->lastInsertId();

            $stmt = $pdo->prepare("INSERT INTO candidates (election_id, number, name, party) VALUES (?, ?, ?, ?)");
            foreach ($candidates as $candidate) {
                $stmt->execute([$election_id, $candidate['number'], $candidate['name'], $candidate['party']]);
            }

            $pdo->commit();
            echo json_encode(['success' => true, 'election_id' => $election_id]);
        } catch (Exception $e) {
            $pdo->rollBack();
            echo json_encode(['success' => false, 'message' => 'Erro ao salvar eleição: ' . $e->getMessage()]);
        }
        break;

    case 'get_elections':
        $stmt = $pdo->query("SELECT id, title, is_finished FROM elections ORDER BY created_at DESC");
        $elections = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'elections' => $elections]);
        break;

    case 'get_election_data':
        $election_id = $_GET['election_id'] ?? 0;
        $stmt = $pdo->prepare("SELECT * FROM elections WHERE id = ?");
        $stmt->execute([$election_id]);
        $election = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$election) {
            echo json_encode(['success' => false, 'message' => 'Eleição não encontrada']);
            exit;
        }

        $stmt = $pdo->prepare("SELECT number, name, party FROM candidates WHERE election_id = ?");
        $stmt->execute([$election_id]);
        $candidates = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(['success' => true, 'election' => $election, 'candidates' => $candidates]);
        break;

    case 'register_vote':
        $election_id = $_POST['election_id'] ?? 0;
        $candidate_number = $_POST['candidate_number'] ?? null;

        $stmt = $pdo->prepare("SELECT is_finished FROM elections WHERE id = ?");
        $stmt->execute([$election_id]);
        $election = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$election || $election['is_finished']) {
            echo json_encode(['success' => false, 'message' => 'Eleição inválida ou finalizada']);
            exit;
        }

        $uuid = sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );

        $stmt = $pdo->prepare("INSERT INTO votes (id, election_id, candidate_number) VALUES (?, ?, ?)");
        $stmt->execute([$uuid, $election_id, $candidate_number]);
        echo json_encode(['success' => true]);
        break;

    case 'end_election':
        $election_id = $_POST['election_id'] ?? 0;
        $password = $_POST['password'] ?? '';

        $stmt = $pdo->prepare("SELECT end_password FROM elections WHERE id = ?");
        $stmt->execute([$election_id]);
        $election = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$election || !password_verify($password, $election['end_password'])) {
            echo json_encode(['success' => false, 'message' => 'Senha incorreta']);
            exit;
        }

        $stmt = $pdo->prepare("UPDATE elections SET is_finished = TRUE WHERE id = ?");
        $stmt->execute([$election_id]);
        echo json_encode(['success' => true]);
        break;

    case 'get_results':
        $election_id = $_GET['election_id'] ?? 0;
        $stmt = $pdo->prepare("SELECT title FROM elections WHERE id = ?");
        $stmt->execute([$election_id]);
        $election = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$election) {
            echo json_encode(['success' => false, 'message' => 'Eleição não encontrada']);
            exit;
        }

        $stmt = $pdo->prepare("SELECT candidate_number, COUNT(*) as count FROM votes WHERE election_id = ? GROUP BY candidate_number");
        $stmt->execute([$election_id]);
        $votes = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $stmt = $pdo->prepare("SELECT number, name, party FROM candidates WHERE election_id = ?");
        $stmt->execute([$election_id]);
        $candidates = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $results = [];
        foreach ($candidates as $candidate) {
            $count = array_reduce($votes, fn($carry, $vote) => $vote['candidate_number'] === $candidate['number'] ? $carry + $vote['count'] : $carry, 0);
            $results[] = ['number' => $candidate['number'], 'name' => $candidate['name'], 'party' => $candidate['party'], 'count' => $count];
        }

        $white_votes = array_reduce($votes, fn($carry, $vote) => $vote['candidate_number'] === '00' ? $carry + $vote['count'] : $carry, 0);
        $null_votes = array_reduce($votes, fn($carry, $vote) => $vote['candidate_number'] === null ? $carry + $vote['count'] : $carry, 0);

        $results[] = ['number' => '00', 'name' => 'Voto em Branco', 'party' => '', 'count' => $white_votes];
        $results[] = ['number' => '', 'name' => 'Voto Nulo', 'party' => '', 'count' => $null_votes];

        echo json_encode(['success' => true, 'title' => $election['title'], 'results' => $results]);
        break;

    default:
        echo json_encode(['success' => false, 'message' => 'Ação inválida']);
}
?>