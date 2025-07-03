<?php
include 'conexao.php';
$titulo = "Teste Eleição";
$eleicao_id = criarEleicao($titulo);
echo "Eleição criada com ID: " . $eleicao_id;
?>