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
const blankBtn = document.getElementById('blank-btn');
const corrigeBtn = document.getElementById('corrige-btn');
const confirmaBtn = document.getElementById('confirma-btn');

const transitionScreen = document.getElementById('transition-screen');

const resultsScreen = document.getElementById('results-screen');
const resultsElectionTitle = document.getElementById('results-election-title');
const resultsTable = document.getElementById('results-table');
const resultsChart = document.getElementById('results-chart');
const endVotingBtn = document.getElementById('end-voting-btn');

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
}

function resetVotingScreen() {
    currentVote = "";
    hasVoted = false;
    updateDisplay();
    candidateDisplay.innerHTML = "";
    currentElectionTitle.textContent = electionTitle;
    voteOffice.textContent = electionTitle.toUpperCase();
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
    passwordError.style.display = 'none';
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
        if (hasVoted) {
            alert("Você já votou! Aguarde o próximo eleitor.");
            return;
        }
        if (currentVote.length < 2) {
            currentVote += key.getAttribute('data-number');
            updateDisplay();

            if (currentVote.length === 2) {
                checkCandidate();
                confirmaBtn.style.display = "block";
            }
        }
    });
});

corrigeBtn.addEventListener('click', () => {
    if (hasVoted) {
        alert("Você já votou! Aguarde o próximo eleitor.");
        return;
    }
    currentVote = "";
    updateDisplay();
    candidateDisplay.innerHTML = "";
    confirmaBtn.style.display = "none";
});

confirmaBtn.addEventListener('click', () => {
    if (hasVoted) {
        alert("Você já votou! Aguarde o próximo eleitor.");
        return;
    }
    if (currentVote.length === 2 || currentVote === "00") {
        registerVote();
    }
});

blankBtn.addEventListener('click', () => {
    if (hasVoted) {
        alert("Você já votou! Aguarde o próximo eleitor.");
        return;
    }
    currentVote = "00";
    voteNumbers.textContent = "00";
    candidateDisplay.innerHTML = "<div style='margin-top: 10px;'><strong>VOTO EM BRANCO</strong></div>";
    confirmaBtn.style.display = "block";
});

endVotingBtn.addEventListener('click', () => {
    endVotingModal.style.display = 'flex';
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

// Funções principais
async function saveElection(endPassword) {
    const formData = new FormData();
    formData.append('action', 'save_election');
    formData.append('title', electionTitle);
    formData.append('end_password', endPassword);
    formData.append('candidates', JSON.stringify(candidates));

    try {
        const saveResponse = await fetch('backend/api.php', {
            method: 'POST',
            body: formData
        });

        const responseText = await saveResponse.text();
        console.log('Raw response:', responseText);

        let result;
        try {
            result = JSON.parse(responseText);
        } catch (e) {
            alert("Erro: Resposta do servidor não é JSON válida: " + responseText);
            return;
        }

        if (result.success) {
            alert("Eleição salva com sucesso!");
            resetElection();
            configurationScreen.classList.remove('active');
            welcomeScreen.classList.add('active');
            electionEndedSection.style.display = 'none';
            startVotingSection.style.display = 'block';
        } else {
            alert("Erro ao salvar eleição: " + result.message);
        }
    } catch (error) {
        alert("Erro na conexão com o servidor: " + error.message);
    }
}

async function loadElections(forResults = false) {
    try {
        const electionsResponse = await fetch('backend/api.php?action=get_elections');
        const result = await electionsResponse.json();

        if (result.success) {
            electionsList.innerHTML = "";
            result.elections.forEach(election => {
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
                        currentElectionId = election.id;
                        electionTitle = election.title;
                        loadElectionData();
                    }
                });
                electionsList.appendChild(div);
            });
        } else {
            alert("Erro ao carregar eleições: " + result.message);
        }
    } catch (error) {
        alert("Erro na conexão com o servidor: " + error.message);
    }
}

async function loadElectionData() {
    try {
        const electionResponse = await fetch(`backend/api.php?action=get_election_data&election_id=${currentElectionId}`);
        const result = await electionResponse.json();

        if (result.success) {
            electionTitle = result.election.title;
            candidates = result.candidates;
            electionSelectionScreen.classList.remove('active');
            votingScreen.classList.add('active');
            resetVotingScreen();
        } else {
            alert("Erro ao carregar dados da eleição: " + result.message);
        }
    } catch (error) {
        alert("Erro na conexão com o servidor: " + error.message);
    }
}

async function registerVote() {
    if (hasVoted) {
        alert("Você já votou! Aguarde o próximo eleitor.");
        return;
    }

    const candidate_number = currentVote === "00" ? "00" : candidates.some(c => c.number === currentVote) ? currentVote : null;

    const formData = new FormData();
    formData.append('action', 'register_vote');
    formData.append('election_id', currentElectionId);
    formData.append('candidate_number', candidate_number);

    try {
        const voteResponse = await fetch('backend/api.php', {
            method: 'POST',
            body: formData
        });
        const result = await voteResponse.json();

        if (result.success) {
            hasVoted = true;
            voteConfirmedSound.currentTime = 0;
            voteConfirmedSound.play().catch(error => {
                console.error("Erro ao tocar som de confirmação:", error);
            });
            voteDisplay.classList.add('vote-confirmed');
            setTimeout(() => {
                voteDisplay.classList.remove('vote-confirmed');
                votingScreen.classList.remove('active');
                transitionScreen.classList.add('active');
                setTimeout(() => {
                    transitionScreen.classList.remove('active');
                    votingScreen.classList.add('active');
                    resetVotingScreen();
                }, 4000);
            }, 1000);
        } else {
            alert("Erro ao registrar voto: " + result.message);
        }
    } catch (error) {
        alert("Erro na conexão com o servidor: " + error.message);
    }
}

async function loadResults() {
    try {
        const resultsResponse = await fetch(`backend/api.php?action=get_results&election_id=${currentElectionId}`);
        const result = await resultsResponse.json();

        if (result.success) {
            electionSelectionScreen.classList.remove('active');
            resultsScreen.classList.add('active');
            endVotingBtn.style.display = isAdmin && !result.is_finished ? 'inline-block' : 'none';
            showResults(result.title, result.results);
        } else {
            alert("Erro ao carregar resultados: " + result.message);
        }
    } catch (error) {
        alert("Erro na conexão com o servidor: " + error.message);
    }
}

async function endElection(password) {
    const formData = new FormData();
    formData.append('action', 'end_election');
    formData.append('election_id', currentElectionId);
    formData.append('password', password);

    try {
        const endResponse = await fetch('backend/api.php', {
            method: 'POST',
            body: formData
        });
        const result = await endResponse.json();

        if (result.success) {
            alert("Votação finalizada com sucesso!");
            endVotingModal.style.display = 'none';
            resultsScreen.classList.remove('active');
            welcomeScreen.classList.add('active');
            electionJustEnded = true;
            electionEndedSection.style.display = 'block';
            startVotingSection.style.display = 'none';
            adminPanel.style.display = isAdmin ? 'block' : 'none';
            resetElection();
        } else {
            endVotingError.style.display = 'block';
            endVotingError.textContent = result.message;
        }
    } catch (error) {
        alert("Erro na conexão com o servidor: " + error.message);
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