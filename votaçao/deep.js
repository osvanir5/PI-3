// Variáveis globais
let electionTitle = "";
let candidates = [];
let currentVote = "";
let currentElectionId = null;
let isAdmin = false;
let chart = null;
let hasVoted = false;
let electionJustEnded = false;
const ADMIN_PASSWORD = "123456";

// Sistema de armazenamento com localStorage
const storage = {
    getElections: () => {
        const elections = JSON.parse(localStorage.getItem('elections')) || [];
        return elections.map(election => ({
            ...election,
            is_finished: election.is_finished || false
        }));
    },
    
    saveElection: (title, end_password, candidates) => {
        const elections = storage.getElections();
        const newElection = {
            id: Date.now().toString(),
            title,
            end_password,
            candidates,
            is_finished: false,
            created_at: new Date().toISOString(),
            votes: []
        };
        elections.unshift(newElection);
        localStorage.setItem('elections', JSON.stringify(elections));
        return newElection;
    },
    
    getElectionData: (election_id) => {
        const elections = storage.getElections();
        return elections.find(e => e.id === election_id);
    },
    
    registerVote: (election_id, candidate_number) => {
        const elections = storage.getElections();
        const electionIndex = elections.findIndex(e => e.id === election_id);
        if (electionIndex === -1) return false;
        
        const voteId = Math.random().toString(36).substr(2, 9);
        elections[electionIndex].votes.push({
            id: voteId,
            candidate_number
        });
        
        localStorage.setItem('elections', JSON.stringify(elections));
        return true;
    },
    
    endElection: (election_id, password) => {
        const elections = storage.getElections();
        const electionIndex = elections.findIndex(e => e.id === election_id);
        if (electionIndex === -1) return { success: false, message: 'Eleição não encontrada' };
        
        if (elections[electionIndex].end_password !== password) {
            return { success: false, message: 'Senha incorreta' };
        }
        
        elections[electionIndex].is_finished = true;
        localStorage.setItem('elections', JSON.stringify(elections));
        return { success: true };
    },
    
    getResults: (election_id) => {
        const election = storage.getElectionData(election_id);
        if (!election) return null;
        
        const votes = election.votes || [];
        const candidates = election.candidates || [];
        
        // Contagem de votos
        const voteCount = {};
        votes.forEach(vote => {
            const key = vote.candidate_number || 'null';
            voteCount[key] = (voteCount[key] || 0) + 1;
        });
        
        // Preparar resultados
        const results = candidates.map(candidate => ({
            number: candidate.number,
            name: candidate.name,
            party: candidate.party,
            count: voteCount[candidate.number] || 0
        }));
        
        // Adicionar votos brancos e nulos
        results.push({
            number: '00',
            name: 'Voto em Branco',
            party: '',
            count: voteCount['00'] || 0
        });
        
        results.push({
            number: '',
            name: 'Voto Nulo',
            party: '',
            count: voteCount['null'] || 0
        });
        
        return {
            title: election.title,
            results
        };
    }
};

// Elementos da interface
const themeToggle = document.getElementById('theme-toggle');
const passwordScreen = document.getElementById('password-screen');
const adminAccessBtn = document.getElementById('admin-access-btn');
const voterAccessBtn = document.getElementById('voter-access-btn');
const adminPasswordModal = document.getElementById('admin-password-modal');
const adminPasswordInput = document.getElementById('admin-password');
const verifyPasswordBtn = document.getElementById('verify-password-btn');
const cancelPasswordBtn = document.getElementById('cancel-password-btn');
const passwordError = document.getElementById('password-error');

const electionSelectionScreen = document.getElementById('election-selection-screen');
const electionsList = document.getElementById('elections-list');
const backToPasswordBtn = document.getElementById('back-to-password-btn');

const welcomeScreen = document.getElementById('welcome-screen');
const adminPanel = document.getElementById('admin-panel');
const electionEndedSection = document.getElementById('election-ended-section');
const startVotingSection = document.getElementById('start-voting-section');
const configElectionBtn = document.getElementById('config-election-btn');
const viewResultsBtn = document.getElementById('view-results-btn');
const startVotingBtn = document.getElementById('start-voting-btn');
const backToInitialBtn = document.querySelectorAll('#back-to-initial-btn');
const viewElectionResultsBtn = document.getElementById('view-election-results-btn');
const backToInitialAfterEndBtn = document.getElementById('back-to-initial-after-end-btn');

const configurationScreen = document.getElementById('configuration-screen');
const electionTitleInput = document.getElementById('election-title');
const endPasswordInput = document.getElementById('end-password');
const candidateNumberInput = document.getElementById('candidate-number');
const candidateNameInput = document.getElementById('candidate-name');
const candidatePartyInput = document.getElementById('candidate-party');
const candidatesContainer = document.getElementById('candidates-container');
const saveVotingBtn = document.getElementById('save-voting-btn');
const backToWelcomeBtn = document.getElementById('back-to-welcome-btn');
const addCandidateBtn = document.getElementById('add-candidate-btn');

const votingScreen = document.getElementById('voting-screen');
const currentElectionTitle = document.getElementById('current-election-title');
const voteDisplay = document.getElementById('vote-display');
const voteOffice = document.getElementById('vote-office');
const voteNumbers = document.getElementById('vote-numbers');
const candidateDisplay = document.getElementById('candidate-display');
const candidateInfo = document.getElementById('candidate-info');
const confirmedName = document.getElementById('confirmed-name');
const confirmedParty = document.getElementById('confirmed-party');
const confirmedNumber = document.getElementById('confirmed-number');

const cancelVoteBtn = document.getElementById('cancel-vote-btn');
const blankBtn = document.getElementById('blank-btn');
const confirmaBtn = document.getElementById('confirma-btn');
const corrigeBtn = document.getElementById('corrige-btn');

const resultsScreen = document.getElementById('results-screen');
const resultsElectionTitle = document.getElementById('results-election-title');
const resultsTable = document.getElementById('results-table');
const resultsChart = document.getElementById('results-chart');

const endVotingModal = document.getElementById('end-voting-modal');
const endVotingPassword = document.getElementById('end-voting-password');
const endVotingError = document.getElementById('end-voting-error');
const confirmEndVotingBtn = document.getElementById('confirm-end-voting-btn');
const cancelEndVotingBtn = document.getElementById('cancel-end-voting-btn');

const keys = document.querySelectorAll('.key[data-number]');
const urnaSound = document.getElementById('urna-sound');
const voteConfirmedSound = document.getElementById('vote-confirmed-sound');

// Funções auxiliares
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
    confirmaBtn.style.display = "block";
}

function showConfirmation() {
    voteDisplay.classList.add('vote-confirmed');
    voteConfirmedSound.currentTime = 0;
    voteConfirmedSound.play().catch(console.error);
    
    candidateDisplay.innerHTML = `
        <div style="color: #2ecc71; font-weight: bold; margin-top: 10px;">
            VOTO REGISTRADO COM SUCESSO!
        </div>
    `;
    
    setTimeout(() => {
        voteDisplay.classList.remove('vote-confirmed');
    }, 1000);
}

function resetVotingScreen() {
    currentVote = "";
    hasVoted = false;
    updateDisplay();
    candidateInfo.style.display = "none";
    candidateDisplay.innerHTML = "";
    currentElectionTitle.textContent = electionTitle;
    voteOffice.textContent = electionTitle.toUpperCase();
    confirmaBtn.style.display = "none";
}

function resetElection() {
    electionTitle = "";
    candidates = [];
    currentVote = "";
    currentElectionId = null;
    hasVoted = false;
    electionJustEnded = false;
    electionTitleInput.value = "";
    endPasswordInput.value = "";
    candidateNumberInput.value = "";
    candidateNameInput.value = "";
    candidatePartyInput.value = "";
    candidatesContainer.innerHTML = "";
    startVotingSection.style.display = 'block';
}

function hasUserVoted(electionId) {
    return localStorage.getItem(`voted_${electionId}`) === 'true';
}

function getNextPendingElection() {
    const elections = storage.getElections();
    return elections.find(e => !e.is_finished && e.id !== currentElectionId);
}

function checkPendingElections() {
    const elections = storage.getElections();
    return elections.filter(e => !e.is_finished && e.id !== currentElectionId);
}

// Função principal para registrar voto
async function registerVote() {
    if (hasVoted || hasUserVoted(currentElectionId)) {
        alert("Você já votou nesta eleição!");
        return;
    }

    const candidate_number = currentVote === "00" ? "00" : 
                          candidates.some(c => c.number === currentVote) ? currentVote : null;
    
    // Registra o voto
    const success = storage.registerVote(currentElectionId, candidate_number);
    
    if (success) {
        // Marca que o usuário votou
        hasVoted = true;
        localStorage.setItem(`voted_${currentElectionId}`, 'true');
        
        // Efeitos visuais e sonoros
        showConfirmation();
        
        // Volta para tela inicial após 2 segundos
        setTimeout(() => {
            votingScreen.classList.remove('active');
            welcomeScreen.classList.add('active');
            resetVotingScreen();
            
            // Verifica se há próxima eleição pendente
            const nextElection = getNextPendingElection();
            if (nextElection) {
                alert(`Próxima eleição disponível: ${nextElection.title}`);
            }
        }, 2000);
    } else {
        alert("Erro ao registrar voto. Por favor, tente novamente.");
    }
}

function showResults(title, results) {
    resultsElectionTitle.textContent = title;
    results.sort((a, b) => b.count - a.count);

    let tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>Número</th>
                    <th>Nome</th>
                    <th>Partido</th>
                    <th>Votos</th>
                    <th>%</th>
                </tr>
            </thead>
            <tbody>
    `;

    const totalVotes = results.reduce((a, b) => a + b.count, 0);

    results.forEach(item => {
        const percentage = totalVotes > 0 ? ((item.count / totalVotes) * 100).toFixed(2) : "0.00";
        tableHTML += `
            <tr>
                <td>${item.number}</td>
                <td>${item.name}</td>
                <td>${item.party}</td>
                <td>${item.count}</td>
                <td>${percentage}%</td>
            </tr>
        `;
    });

    tableHTML += `
            </tbody>
            <tfoot>
                <tr>
                    <td colspan="3">TOTAL</td>
                    <td>${totalVotes}</td>
                    <td>100.00%</td>
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
            labels: results.map(item => item.number ? `${item.number} - ${item.name}` : item.name),
            datasets: [{
                label: 'Votos',
                data: results.map(item => item.count),
                backgroundColor: ['#0066cc', '#4CAF50', '#FF5722', '#9C27B0', '#607D8B'],
                borderColor: ['#004080', '#3e8e41', '#E64A19', '#7B1FA2', '#455A64'],
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

// Funções principais
    async function saveElection(endPassword) {
    // Bloqueia títulos genéricos
    const blockedWords = ["teste", "test", "123", "aaa", "eleição", "votação"];
    const titleLower = electionTitle.toLowerCase();
    
    if (blockedWords.some(word => titleLower.includes(word))) {
        alert("❌ Use um título descritivo!\nEx: 'Eleição do Grêmio 2023'");
        return;
    }
    try {
        const newElection = storage.saveElection(electionTitle, endPassword, candidates);
        alert("Eleição salva com sucesso!");
        resetElection();
        configurationScreen.classList.remove('active');
        welcomeScreen.classList.add('active');
        electionEndedSection.style.display = 'none';
        startVotingSection.style.display = 'block';
    } catch (error) {
        alert("Erro ao salvar eleição: " + error.message);
    }
    const newElection = storage.saveElection(electionTitle, endPassword, candidates);
    alert("Eleição salva com sucesso!");
    resetElection();
    configurationScreen.classList.remove('active');
    welcomeScreen.classList.add('active');

}

async function loadElections(forResults = false) {
    try {
        const elections = storage.getElections();
        electionsList.innerHTML = "";
        
        elections.forEach(election => {
            const div = document.createElement('div');
            div.className = 'election-item';
            div.innerHTML = `
                <h3>${election.title}</h3>
                <p>${election.is_finished ? 'Finalizada - Ver Resultados' : 'Participar da Votação'}</p>
            `;
            div.addEventListener('click', () => {
                if (forResults || election.is_finished) {
                    currentElectionId = election.id;
                    electionTitle = election.title;
                    loadResults();
                } else if (!election.is_finished) {
                    if (hasUserVoted(election.id)) {
                        alert("Você já votou nesta eleição!");
                        return;
                    }
                    currentElectionId = election.id;
                    electionTitle = election.title;
                    loadElectionData();
                }
            });
            electionsList.appendChild(div);
        });
    } catch (error) {
        alert("Erro ao carregar eleições: " + error.message);
    }
}

async function loadElectionData() {
    try {
        const election = storage.getElectionData(currentElectionId);
        if (election) {
            electionTitle = election.title;
            candidates = election.candidates || [];
            electionSelectionScreen.classList.remove('active');
            votingScreen.classList.add('active');
            resetVotingScreen();
        } else {
            alert("Eleição não encontrada!");
        }
    } catch (error) {
        alert("Erro ao carregar dados da eleição: " + error.message);
    }
}

async function loadResults() {
    try {
        const result = storage.getResults(currentElectionId);
        
        if (result) {
            electionSelectionScreen.classList.remove('active');
            resultsScreen.classList.add('active');
            showResults(result.title, result.results);
        } else {
            alert("Resultados não encontrados!");
        }
    } catch (error) {
        alert("Erro ao carregar resultados: " + error.message);
    }
}

async function endElection(password) {
    try {
        const result = storage.endElection(currentElectionId, password);
        
        if (result.success) {
            endVotingModal.style.display = 'none';
            voteConfirmedSound.play().catch(console.error);
            
            // Volta para tela inicial
            votingScreen.classList.remove('active');
            welcomeScreen.classList.add('active');
            
            resetElection();
            electionJustEnded = true;
            electionEndedSection.style.display = 'block';
            startVotingSection.style.display = 'none';
        } else {
            endVotingError.style.display = 'block';
            endVotingError.textContent = result.message;
        }
    } catch (error) {
        alert("Erro ao finalizar eleição: " + error.message);
    }
}

// Event Listeners
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    themeToggle.textContent = document.body.classList.contains('dark-mode') ? '🌞' : '🌙';
});

adminAccessBtn.addEventListener('click', () => {
    adminPasswordModal.style.display = 'flex';
});

cancelPasswordBtn.addEventListener('click', () => {
    adminPasswordModal.style.display = 'none';
    adminPasswordInput.value = '';
    passwordError.style.display = 'none';
});

verifyPasswordBtn.addEventListener('click', () => {
    if (adminPasswordInput.value === ADMIN_PASSWORD) {
        isAdmin = true;
        passwordError.style.display = 'none';
        adminPasswordModal.style.display = 'none';
        passwordScreen.classList.remove('active');
        welcomeScreen.classList.add('active');
        adminPanel.style.display = 'block';
        electionEndedSection.style.display = 'none';
        startVotingSection.style.display = 'block';
    } else {
        passwordError.style.display = 'block';
    }
});

voterAccessBtn.addEventListener('click', () => {
    isAdmin = false;
    const pendingElections = checkPendingElections();
    
    if (pendingElections.length === 0) {
        alert("Não há eleições disponíveis no momento.");
        return;
    }
    
    passwordScreen.classList.remove('active');
    electionSelectionScreen.classList.add('active');
    loadElections();
});

backToPasswordBtn.addEventListener('click', () => {
    electionSelectionScreen.classList.remove('active');
    passwordScreen.classList.add('active');
});

configElectionBtn.addEventListener('click', () => {
    welcomeScreen.classList.remove('active');
    configurationScreen.classList.add('active');
});

viewResultsBtn.addEventListener('click', () => {
    welcomeScreen.classList.remove('active');
    electionSelectionScreen.classList.add('active');
    loadElections(true);
});

startVotingBtn.addEventListener('click', () => {
    if (!currentElectionId) {
        alert("Selecione uma eleição primeiro!");
        return;
    }
    welcomeScreen.classList.remove('active');
    votingScreen.classList.add('active');
    resetVotingScreen();
});

backToWelcomeBtn.addEventListener('click', () => {
    configurationScreen.classList.remove('active');
    welcomeScreen.classList.add('active');
    electionEndedSection.style.display = electionJustEnded ? 'block' : 'none';
    startVotingSection.style.display = electionJustEnded ? 'none' : 'block';
});

backToInitialBtn.forEach(btn => {
    btn.addEventListener('click', () => {
        resultsScreen.classList.remove('active');
        welcomeScreen.classList.remove('active');
        passwordScreen.classList.add('active');
        isAdmin = false;
        adminPanel.style.display = 'none';
        electionEndedSection.style.display = 'none';
        startVotingSection.style.display = 'block';
        resetElection();
    });
});

viewElectionResultsBtn.addEventListener('click', () => {
    welcomeScreen.classList.remove('active');
    loadResults();
    electionJustEnded = false;
    electionEndedSection.style.display = 'none';
    startVotingSection.style.display = 'block';
});

backToInitialAfterEndBtn.addEventListener('click', () => {
    welcomeScreen.classList.remove('active');
    passwordScreen.classList.add('active');
    isAdmin = false;
    adminPanel.style.display = 'none';
    electionEndedSection.style.display = 'none';
    startVotingSection.style.display = 'block';
    resetElection();
});

addCandidateBtn.addEventListener('click', () => {
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

    candidates.push({ number, name, party });
    updateCandidatesList();

    candidateNumberInput.value = "";
    candidateNameInput.value = "";
    candidatePartyInput.value = "";
});

saveVotingBtn.addEventListener('click', () => {
    electionTitle = electionTitleInput.value.trim();
    const endPassword = endPasswordInput.value.trim();

    if (!electionTitle) {
        alert("Por favor, insira um título para a eleição!");
        return;
    }

    if (!endPassword) {
        alert("Por favor, insira uma senha para finalizar a votação!");
        return;
    }

    if (candidates.length < 2) {
        alert("Por favor, adicione pelo menos 2 candidatos/opções!");
        return;
    }

    saveElection(endPassword);
});

keys.forEach(key => {
    key.addEventListener('click', () => {
        if (hasVoted) return;
        
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
    if (hasVoted) return;
    
    currentVote = "";
    updateDisplay();
    candidateInfo.style.display = "none";
    candidateDisplay.innerHTML = "";
    confirmaBtn.style.display = "none";
});

confirmaBtn.addEventListener('click', () => {
    if (hasVoted) return;
    
    if (currentVote.length === 2 || currentVote === "00") {
        registerVote();
    } else {
        alert("Por favor, digite um número válido de 2 dígitos ou clique em BRANCO");
    }
});

blankBtn.addEventListener('click', () => {
    if (hasVoted) return;
    
    currentVote = "00";
    voteNumbers.textContent = "00";
    candidateDisplay.innerHTML = "<div style='margin-top: 10px;'><strong>VOTO EM BRANCO</strong></div>";
    registerVote();
});

cancelVoteBtn.addEventListener('click', () => {
    if (hasVoted) return;
    
    candidateInfo.style.display = "none";
});

confirmEndVotingBtn.addEventListener('click', () => {
    const password = endVotingPassword.value.trim();
    endElection(password);
});

cancelEndVotingBtn.addEventListener('click', () => {
    endVotingModal.style.display = 'none';
    endVotingPassword.value = "";
    endVotingError.style.display = 'none';
});
// ========== [FUNÇÃO PARA LIMPAR ELEIÇÕES] ==========
function limparTodasEleicoes() {
    // Verifica se é admin
    if (!isAdmin) {
        alert("Apenas administradores podem limpar as eleições!");
        return;
    }

    // Confirmação importante
    if (confirm("⚠️ ATENÇÃO! Isso apagará TODAS as eleições.\n\nDeseja continuar?")) {
        localStorage.removeItem('elections');
        
        // Atualiza a interface
        alert("Todas as eleições foram removidas com sucesso!");
        if (electionSelectionScreen.classList.contains('active')) {
            loadElections();
        }
        
        // Reseta as variáveis
        currentElectionId = null;
        electionTitle = "";
        candidates = [];
    }
}
// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    passwordScreen.classList.add('active');
});