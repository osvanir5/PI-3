<?php
header('Content-Type: application/json');
include 'conexao.php';

$action = $_POST['action'] ?? '';

if ($action === 'criar_eleicao') {
    $titulo = $_POST['titulo'] ?? '';
    if ($titulo) {
        $eleicao_id = criarEleicao($titulo);
        echo json_encode(['success' => true, 'eleicao_id' => $eleicao_id]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Título inválido']);
    }
}

if ($action === 'adicionar_candidato') {
    $eleicao_id = $_POST['eleicao_id'] ?? 0;
    $numero = $_POST['numero'] ?? '';
    $nome = $_POST['nome'] ?? '';
    $partido = $_POST['partido'] ?? '';
    if ($eleicao_id && $numero && $nome) {
        adicionarCandidato($eleicao_id, $numero, $nome, $partido);
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Dados inválidos']);
    }
}

if ($action === 'registrar_voto') {
    $eleicao_id = $_POST['eleicao_id'] ?? 0;
    $candidato_numero = $_POST['candidato_numero'] ?? '';
    if ($eleicao_id && $candidato_numero) {
        registrarVoto($eleicao_id, $candidato_numero);
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Dados inválidos']);
    }
}

if ($action === 'obter_resultados') {
    $eleicao_id = $_POST['eleicao_id'] ?? 0;
    if ($eleicao_id) {
        $resultados = obterResultados($eleicao_id);
        echo json_encode(['success' => true, 'resultados' => $resultados]);
    } else {
        echo json_encode(['success' => false, 'error' => 'ID da eleição inválido']);
    }
}

if ($action === 'atualizar_titulo_eleicao') {
    $eleicao_id = $_POST['eleicao_id'] ?? 0;
    $titulo = $_POST['titulo'] ?? '';
    if ($eleicao_id && $titulo) {
        $stmt = $conexao->prepare("UPDATE eleicoes SET titulo = ? WHERE id = ?");
        $stmt->bind_param("si", $titulo, $eleicao_id);
        $stmt->execute();
        $stmt->close();
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Dados inválidos']);
    }
}
?>