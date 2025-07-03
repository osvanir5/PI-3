<?php
$dbHost = "localhost";
$dbUsername = "root";
$dbPassword = "";
$dbName = "simulador_urna";

$conexao = new mysqli($dbHost, $dbUsername, $dbPassword, $dbName);

if ($conexao->connect_error) {
    die("Conexão falhou: " . $conexao->connect_error);
}

// Função para criar uma nova eleição
function criarEleicao($titulo) {
    global $conexao;
    $stmt = $conexao->prepare("INSERT INTO eleicoes (titulo) VALUES (?)");
    $stmt->bind_param("s", $titulo);
    $stmt->execute();
    $eleicao_id = $conexao->insert_id;
    $stmt->close();
    return $eleicao_id;
}

// Função para adicionar candidato
function adicionarCandidato($eleicao_id, $numero, $nome, $partido) {
    global $conexao;
    $stmt = $conexao->prepare("INSERT INTO candidatos (eleicao_id, numero, nome, partido) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("isss", $eleicao_id, $numero, $nome, $partido);
    $stmt->execute();
    $stmt->close();
}

// Função para registrar voto
function registrarVoto($eleicao_id, $candidato_numero) {
    global $conexao;
    $stmt = $conexao->prepare("INSERT INTO votos (eleicao_id, candidato_numero) VALUES (?, ?)");
    $stmt->bind_param("is", $eleicao_id, $candidato_numero);
    $stmt->execute();
    $stmt->close();
}

// Função para obter resultados
function obterResultados($eleicao_id) {
    global $conexao;
    $resultados = [];
    $sql = "SELECT c.numero, c.nome, c.partido, COUNT(v.id) as votos
            FROM candidatos c
            LEFT JOIN votos v ON c.numero = v.candidato_numero AND c.eleicao_id = v.eleicao_id
            WHERE c.eleicao_id = ?
            GROUP BY c.numero, c.nome, c.partido";
    $stmt = $conexao->prepare($sql);
    $stmt->bind_param("i", $eleicao_id);
    $stmt->execute();
    $result = $stmt->get_result();
    while ($row = $result->fetch_assoc()) {
        $resultados[] = $row;
    }
    $stmt->close();
    return $resultados;
}

function atualizarTituloEleicao($eleicao_id, $titulo) {
    global $conexao;
    $stmt = $conexao->prepare("UPDATE eleicoes SET titulo = ? WHERE id = ?");
    $stmt->bind_param("si", $titulo, $eleicao_id);
    $stmt->execute();
    $stmt->close();
}
?>