// Variáveis globais
let electionTitle = "";
let candidates = [];
let votes = {};
let currentVote = "";
let votedInSession = false;
let chart = null;
let electionId = null; // Para armazenar o ID da eleição no banco

const welcomeScreen = document.getElementById('welcome-screen');
const configurationScreen = document.getElementById('configuration-screen');
const votingScreen = document.getElementById('voting-screen');
const resultsScreen = document.getElementById('results-screen');

const startConfigBtn = document.getElementById('start-config-btn');
const quickStartBtn = document.getElementById('quick-start-btn');
const backToWelcomeBtn = document.getElementById('back-to-welcome-btn');
const addCandidateBtn = document.getElementById('add-candidate-btn');
const startVotingBtn = document.getElementById('start-voting-btn');
const showResultsBtn = document.getElementById('show-results-btn');
const newElectionBtn = document.getElementById('new-election-btn');

const electionTitleInput = document.getElementById('election-title');
const candidateNumberInput = document.getElementById('candidate-number');
const candidateNameInput = document.getElementById('candidate-name');
const candidatePartyInput = document.getElementById('candidate-party');
const candidatesContainer = document.getElementById('candidates-container');

const currentElectionTitle = document.getElementById('current-election-title');
const voteDisplay = document.getElementById('vote-display');
const voteOffice = document.getElementById('vote-office');
const voteNumbers = document.getElementById('vote-numbers');
const candidateDisplay = document.getElementById('candidate-display');
const candidateInfo = document.getElementById('candidate-info');
const confirmedName = document.getElementById('confirmed-name');
const confirmedParty = document.getElementById('confirmed-party');
const confirmedNumber = document.getElementById('confirmed-number');
const finalConfirmBtn = document.getElementById('final-confirm-btn');
const cancelVoteBtn = document.getElementById('cancel-vote-btn');

const resultsElectionTitle = document.getElementById('results-election-title');
const resultsTable = document.getElementById('results-table');
const resultsChart = document.getElementById('results-chart');

const keys = document.querySelectorAll('.key[data-number]');
const corrigeBtn = document.getElementById('corrige-btn');
const confirmaBtn = document.getElementById('confirma-btn');

const themeBtns = document.querySelectorAll('.theme-btn');

// Função para enviar requisições AJAX
async function sendRequest(action, data) {
    const formData = new FormData();
    formData.append('action', action);
    for (const key in data) {
        formData.append(key, data[key]);
    }
    try {
        const response = await fetch('api.php', {
            method: 'POST',
            body: formData
        });
        if (!response.ok) {
            console.error(`Erro HTTP: ${response.status} ${response.statusText}`);
            return { success: false, error: `Erro HTTP: ${response.status} ${response.statusText}` };
        }
        const result = await response.json();
        console.log(`Requisição ${action}:`, result); // Log para debug
        return result;
    } catch (error) {
        console.error(`Erro na requisição ${action}:`, error);
        return { success: false, error: 'Erro de conexão com o servidor' };
    }
}

// Eventos
startConfigBtn.addEventListener('click', async () => {
    welcomeScreen.classList.remove('active');
    configurationScreen.classList.add('active');

    // Criar uma eleição temporária com título genérico
    const response = await sendRequest('criar_eleicao', { titulo: 'Eleição Temporária' });
    if (response.success) {
        electionId = response.eleicao_id;
    } else {
        alert("Erro ao iniciar configuração: " + response.error);
        configurationScreen.classList.remove('active');
        welcomeScreen.classList.add('active');
    }
});

quickStartBtn.addEventListener('click', async () => {
    electionTitle = "Eleição para Representante de Turma";
    const response = await sendRequest('criar_eleicao', { titulo: electionTitle });
    if (response.success) {
        electionId = response.eleicao_id;
        candidates = [
            { number: "10", name: "Ana Silva", party: "Partido dos Estudantes" },
            { number: "22", name: "Carlos Oliveira", party: "Aliança Jovem" },
            { number: "35", name: "Mariana Costa", party: "Movimento Educacional" },
            { number: "40", name: "Voto Nulo", party: "" },
            { number: "99", name: "Voto em Branco", party: "" }
        ];
        for (const candidate of candidates) {
            await sendRequest('adicionar_candidato', {
                eleicao_id: electionId,
                numero: candidate.number,
                nome: candidate.name,
                partido: candidate.party
            });
        }
        initializeVoting();
        welcomeScreen.classList.remove('active');
        votingScreen.classList.add('active');
        currentElectionTitle.textContent = electionTitle;
        voteOffice.textContent = "REPRESENTANTE";
    } else {
        alert("Erro ao criar eleição: " + response.error);
    }
});

backToWelcomeBtn.addEventListener('click', () => {
    configurationScreen.classList.remove('active');
    welcomeScreen.classList.add('active');
});

// Modificar o evento de addCandidateBtn
addCandidateBtn.addEventListener('click', async () => {
    if (!electionId) {
        alert("Erro: Nenhuma eleição iniciada. Volte à tela inicial e tente novamente.");
        return;
    }
    
    const number = candidateNumberInput.value.padStart(2, '0');
    const name = candidateNameInput.value.trim();
    const party = candidatePartyInput.value.trim();
    
    if (number.length !== 2 || isNaN(number)) {
        alert("O número do candidato deve ter exatamente 2 dígitos!");
        return;
    }
    
    if (!name) {
        alert("Por favor, insira o nome do candidato/opção!");
        return;
    }

    if (candidates.some(c => c.number === number)) {
        alert("Já existe um candidato/opção com este número!");
        return;
    }

    const response = await sendRequest('adicionar_candidato', {
        eleicao_id: electionId,
        numero: number,
        nome: name,
        partido: party
    });

    if (response.success) {
        candidates.push({ number, name, party });
        updateCandidatesList();
        candidateNumberInput.value = "";
        candidateNameInput.value = "";
        candidatePartyInput.value = "";
    } else {
        alert("Erro ao adicionar candidato: " + response.error);
    }
});

startVotingBtn.addEventListener('click', async () => {
    electionTitle = electionTitleInput.value.trim();
    
    if (!electionTitle) {
        alert("Por favor, insira um título para a eleição!");
        return;
    }
    
    if (candidates.length < 2) {
        alert("Por favor, adicione pelo menos 2 candidatos/opções!");
        return;
    }

    //Comentado para fazer testes
    // const response = await sendRequest('criar_eleicao', { titulo: electionTitle });
    // if (response.success) {
    //     electionId = response.eleicao_id;
    //     for (const candidate of candidates) {
    //         await sendRequest('adicionar_candidato', {
    //             eleicao_id: electionId,
    //             numero: candidate.number,
    //             nome: candidate.name,
    //             partido: candidate.party
    //         });
    //     }
    //     initializeVoting();
    //     configurationScreen.classList.remove('active');
    //     votingScreen.classList.add('active');
    //     currentElectionTitle.textContent = electionTitle;
    //     voteOffice.textContent = electionTitle.toUpperCase();
    // } else {
    //     alert("Erro ao criar eleição: " + response.error);
    // }

    // Atualizar o título da eleição no banco
    const response = await sendRequest('atualizar_titulo_eleicao', {
        eleicao_id: electionId,
        titulo: electionTitle
    });

    if (response.success) {
        initializeVoting();
        configurationScreen.classList.remove('active');
        votingScreen.classList.add('active');
        currentElectionTitle.textContent = electionTitle;
        voteOffice.textContent = electionTitle.toUpperCase();
    } else {
        alert("Erro ao atualizar eleição: " + response.error);
    }
});

showResultsBtn.addEventListener('click', async () => {
    votingScreen.classList.remove('active');
    resultsScreen.classList.add('active');
    await showResults();
});

newElectionBtn.addEventListener('click', () => {
    candidates = [];
    votes = {};
    currentVote = "";
    votedInSession = false;
    electionId = null;
    
    electionTitleInput.value = "";
    candidateNumberInput.value = "";
    candidateNameInput.value = "";
    candidatePartyInput.value = "";
    candidatesContainer.innerHTML = "";
    
    resultsScreen.classList.remove('active');
    welcomeScreen.classList.add('active');
});

keys.forEach(key => {
    key.addEventListener('click', () => {
        if (votedInSession) {
            alert("Você já votou nesta sessão. Inicie uma nova eleição para votar novamente.");
            return;
        }
        
        if (currentVote.length < 2) {
            currentVote += key.getAttribute('data-number');
            updateDisplay();
            
            if (currentVote.length === 2) {
                checkCandidate();
            }
        }
    });
});

corrigeBtn.addEventListener('click', () => {
    currentVote = "";
    updateDisplay();
    candidateInfo.style.display = "none";
    candidateDisplay.innerHTML = "";
});

confirmaBtn.addEventListener('click', () => {
    if (currentVote.length === 2) {
        showConfirmation();
    }
});

finalConfirmBtn.addEventListener('click', async () => {
    await registerVote();
    candidateInfo.style.display = "none";
    currentVote = "";
    updateDisplay();
    voteDisplay.classList.add('vote-confirmed');
    setTimeout(() => {
        voteDisplay.classList.remove('vote-confirmed');
    }, 1000);
});

cancelVoteBtn.addEventListener('click', () => {
    candidateInfo.style.display = "none";
});

themeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        document.body.className = btn.getAttribute('data-theme');
        themeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

// Funções
function updateCandidatesList() {
    candidatesContainer.innerHTML = "";
    candidates.forEach(candidate => {
        const div = document.createElement('div');
        div.className = "candidate-item";
        div.innerHTML = `
            <span><strong>${candidate.number}</strong> - ${candidate.name}</span>
            <span>${candidate.party || ''}</span>
        `;
        candidatesContainer.appendChild(div);
    });
}

function initializeVoting() {
    votes = {};
    candidates.forEach(candidate => {
        votes[candidate.number] = 0;
    });
    currentVote = "";
    votedInSession = false;
}

function updateDisplay() {
    voteNumbers.innerHTML = currentVote.split('').join(' ');
}

function checkCandidate() {
    const candidate = candidates.find(c => c.number === currentVote);
    
    if (candidate) {
        candidateDisplay.innerHTML = `
            <div style="margin-top: 10px;">
                <strong>${candidate.name}</strong><br>
                ${candidate.party || ''}
            </div>
        `;
    } else {
        candidateDisplay.innerHTML = `
            <div style="margin-top: 10px; color: #f00;">
                CANDIDATO NÃO CADASTRADO
            </div>
        `;
    }
}

function showConfirmation() {
    const candidate = candidates.find(c => c.number === currentVote);
    
    if (candidate) {
        confirmedName.textContent = candidate.name;
        confirmedParty.textContent = candidate.party || "";
        confirmedNumber.textContent = `Número: ${candidate.number}`;
        candidateInfo.style.display = "block";
    } else {
        confirmedName.textContent = "VOTO NULO";
        confirmedParty.textContent = "";
        confirmedNumber.textContent = `Número: ${currentVote}`;
        candidateInfo.style.display = "block";
    }
}

async function registerVote() {
    const candidate = candidates.find(c => c.number === currentVote);
    const voteKey = candidate ? candidate.number : currentVote;
    
    const response = await sendRequest('registrar_voto', {
        eleicao_id: electionId,
        candidato_numero: voteKey
    });

    if (response.success) {
        if (!votes[voteKey]) {
            votes[voteKey] = 0;
        }
        votes[voteKey]++;
        votedInSession = true;
    } else {
        alert("Erro ao registrar voto: " + response.error);
    }
}

async function showResults() {
    resultsElectionTitle.textContent = electionTitle;
    
    const response = await sendRequest('obter_resultados', { eleicao_id: electionId });
    if (!response.success) {
        alert("Erro ao obter resultados: " + response.error);
        return;
    }

    const results = response.resultados.map(item => ({
        number: item.numero,
        name: item.nome || (item.numero === "00" ? "Voto em Branco" : "Voto Nulo"),
        party: item.partido || "",
        count: item.votos
    }));

    results.sort((a, b) => b.count - a.count);
    
    let tableHTML = `
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="background-color: var(--primary-color); color: white;">
                    <th style="padding: 10px; text-align: left;">Número</th>
                    <th style="padding: 10px; text-align: left;">Nome</th>
                    <th style="padding: 10px; text-align: left;">Partido</th>
                    <th style="padding: 10px; text-align: right;">Votos</th>
                    <th style="padding: 10px; text-align: right;">%</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    const totalVotes = results.reduce((a, b) => a + b.count, 0);
    
    results.forEach(item => {
        const percentage = totalVotes > 0 ? ((item.count / totalVotes) * 100).toFixed(2) : "0.00";
        tableHTML += `
            <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 10px;">${item.number}</td>
                <td style="padding: 10px;">${item.name}</td>
                <td style="padding: 10px;">${item.party}</td>
                <td style="padding: 10px; text-align: right;">${item.count}</td>
                <td style="padding: 10px; text-align: right;">${percentage}%</td>
            </tr>
        `;
    });
    
    tableHTML += `
            </tbody>
            <tfoot>
                <tr style="background-color: var(--light-gray); font-weight: bold;">
                    <td style="padding: 10px;" colspan="3">TOTAL</td>
                    <td style="padding: 10px; text-align: right;">${totalVotes}</td>
                    <td style="padding: 10px; text-align: right;">100.00%</td>
                </tr>
            </tfoot>
        </table>
    `;
    
    resultsTable.innerHTML = tableHTML;
    
    const ctx = resultsChart.getContext('2d');
    
    if (chart) {
        chart.destroy();
    }
    
    chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: results.map(item => `${item.number} - ${item.name}`),
            datasets: [{
                label: 'Votos',
                data: results.map(item => item.count),
                backgroundColor: results.map((_, i) => {
                    const colors = ['#0066cc', '#4CAF50', '#FF5722', '#9C27B0', '#607D8B'];
                    return colors[i % colors.length];
                }),
                borderColor: results.map((_, i) => {
                    const colors = ['#004080', '#3e8e41', '#E64A19', '#7B1FA2', '#455A64'];
                    return colors[i % colors.length];
                }),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const percentage = ((context.raw / totalVotes) * 100).toFixed(2);
                            return `${context.raw} votos (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}