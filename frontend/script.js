// API Configuration
const API_BASE_URL = window.location.origin;

// State Management
let allFighters = [];
let weightClasses = [];
let currentPrediction = null;
let comparisonChart = null;

// Theme Management
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const icon = document.querySelector('.theme-icon');
    icon.textContent = theme === 'dark' ? '☀️' : '🌙';
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initTheme();
    loadWeightClasses();
    loadFighters();
    loadStats();
    loadPredictionHistory();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    document.getElementById('theme-toggle-btn').addEventListener('click', toggleTheme);
    document.getElementById('predictBtn').addEventListener('click', makePrediction);
    document.getElementById('toggle-details').addEventListener('click', toggleModelDetails);
    document.getElementById('save-prediction').addEventListener('click', savePrediction);
    document.getElementById('clear-history').addEventListener('click', clearHistory);
    document.getElementById('weight-class').addEventListener('change', handleWeightClassChange);

    setupFighterAutocomplete('fighter1');
    setupFighterAutocomplete('fighter2');
}

// Load Overall Stats
async function loadStats() {
    try {
        const response = await fetch(\`\${API_BASE_URL}/api/stats\`);
        const data = await response.json();

        document.getElementById('total-fights').textContent = data.total_fights || '0';
        document.getElementById('total-fighters').textContent = data.total_fighters || '0';
        document.getElementById('weight-classes-count').textContent = data.weight_classes || '0';
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load Weight Classes
async function loadWeightClasses() {
    try {
        const response = await fetch(\`\${API_BASE_URL}/weight-classes\`);
        const data = await response.json();
        weightClasses = data.weight_classes || [];

        const select = document.getElementById('weight-class');
        select.innerHTML = '<option value="All">All Weight Classes</option>';

        weightClasses.forEach(wc => {
            if (wc !== 'Unknown') {
                const option = document.createElement('option');
                option.value = wc;
                option.textContent = wc;
                select.appendChild(option);
            }
        });
    } catch (error) {
        console.error('Error loading weight classes:', error);
    }
}

// Load Fighters
async function loadFighters() {
    const weightClass = document.getElementById('weight-class').value;
    const url = weightClass === 'All'
        ? \`\${API_BASE_URL}/fighters\`
        : \`\${API_BASE_URL}/fighters?weight_class=\${encodeURIComponent(weightClass)}\`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        allFighters = data.fighters || [];
    } catch (error) {
        console.error('Error loading fighters:', error);
    }
}

function handleWeightClassChange() {
    loadFighters();
    document.getElementById('fighter1').value = '';
    document.getElementById('fighter2').value = '';
}

// Autocomplete Setup
function setupFighterAutocomplete(inputId) {
    const input = document.getElementById(inputId);
    const suggestionsDiv = document.getElementById(\`\${inputId}-suggestions\`);

    input.addEventListener('input', function() {
        const value = this.value.toLowerCase();
        suggestionsDiv.innerHTML = '';

        if (value.length < 2) {
            suggestionsDiv.classList.add('hidden');
            return;
        }

        const filtered = allFighters.filter(fighter =>
            fighter.toLowerCase().includes(value)
        ).slice(0, 10);

        if (filtered.length === 0) {
            suggestionsDiv.classList.add('hidden');
            return;
        }

        filtered.forEach(fighter => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            div.textContent = fighter;
            div.addEventListener('click', function() {
                input.value = fighter;
                suggestionsDiv.innerHTML = '';
                suggestionsDiv.classList.add('hidden');
                loadFighterWeightClasses(fighter, inputId);
            });
            suggestionsDiv.appendChild(div);
        });

        suggestionsDiv.classList.remove('hidden');
    });

    input.addEventListener('blur', function() {
        setTimeout(() => {
            suggestionsDiv.classList.add('hidden');
        }, 200);
    });
}

async function loadFighterWeightClasses(fighterName, inputId) {
    try {
        const response = await fetch(\`\${API_BASE_URL}/fighter-weight-classes/\${encodeURIComponent(fighterName)}\`);
        const data = await response.json();

        const weightClassInfo = document.getElementById(\`\${inputId}-weight-classes\`);
        if (data.weight_classes && data.weight_classes.length > 0) {
            weightClassInfo.textContent = \`Fights in: \${data.weight_classes.join(', ')}\`;
            weightClassInfo.classList.remove('hidden');
        } else {
            weightClassInfo.classList.add('hidden');
        }
    } catch (error) {
        console.error('Error loading fighter weight classes:', error);
    }
}

// Make Prediction
async function makePrediction() {
    const fighter1 = document.getElementById('fighter1').value.trim();
    const fighter2 = document.getElementById('fighter2').value.trim();
    let weightClass = document.getElementById('weight-class').value;

    if (!fighter1 || !fighter2) {
        showError('Please enter both fighter names');
        return;
    }

    if (fighter1.toLowerCase() === fighter2.toLowerCase()) {
        showError('Please select two different fighters');
        return;
    }

    if (weightClass === 'All') {
        weightClass = '';
    }

    // Show loading
    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('result').classList.add('hidden');
    document.getElementById('error').classList.add('hidden');
    document.getElementById('fighter-comparison').classList.add('hidden');

    try {
        // Load fighter comparison first
        await loadFighterComparison(fighter1, fighter2);

        // Make prediction
        const response = await fetch(\`\${API_BASE_URL}/predict\`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                fighter1: fighter1,
                fighter2: fighter2,
                weight_class: weightClass
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Prediction failed');
        }

        const data = await response.json();
        currentPrediction = {
            fighter1,
            fighter2,
            ...data,
            timestamp: new Date().toISOString()
        };

        displayPrediction(data, fighter1, fighter2);
    } catch (error) {
        showError(error.message);
    } finally {
        document.getElementById('loading').classList.add('hidden');
    }
}

// Load Fighter Comparison
async function loadFighterComparison(fighter1, fighter2) {
    try {
        const response = await fetch(\`\${API_BASE_URL}/api/compare/\${encodeURIComponent(fighter1)}/\${encodeURIComponent(fighter2)}\`);

        if (!response.ok) {
            throw new Error('Failed to load comparison data');
        }

        const data = await response.json();
        displayFighterComparison(data);
    } catch (error) {
        console.error('Error loading fighter comparison:', error);
    }
}

function displayFighterComparison(data) {
    const comparisonDiv = document.getElementById('fighter-comparison');
    const f1 = data.fighter1;
    const f2 = data.fighter2;

    // Update fighter names
    document.getElementById('fighter1-name').textContent = f1.name;
    document.getElementById('fighter2-name').textContent = f2.name;

    // Update fighter stats
    document.getElementById('fighter1-stats').innerHTML = \`
        <p><strong>Record:</strong> \${f1.career_wins}-\${f1.career_losses}</p>
        <p><strong>Win Rate:</strong> \${(f1.win_rate * 100).toFixed(1)}%</p>
        <p><strong>Career Fights:</strong> \${f1.career_fights}</p>
        <p><strong>Avg Strikes:</strong> \${f1.avg_strikes.toFixed(2)}</p>
        <p><strong>Avg Takedowns:</strong> \${f1.avg_takedowns.toFixed(2)}</p>
    \`;

    document.getElementById('fighter2-stats').innerHTML = \`
        <p><strong>Record:</strong> \${f2.career_wins}-\${f2.career_losses}</p>
        <p><strong>Win Rate:</strong> \${(f2.win_rate * 100).toFixed(1)}%</p>
        <p><strong>Career Fights:</strong> \${f2.career_fights}</p>
        <p><strong>Avg Strikes:</strong> \${f2.avg_strikes.toFixed(2)}</p>
        <p><strong>Avg Takedowns:</strong> \${f2.avg_takedowns.toFixed(2)}</p>
    \`;

    // Create radar chart
    createComparisonChart(f1, f2);

    comparisonDiv.classList.remove('hidden');
}

function createComparisonChart(fighter1, fighter2) {
    const ctx = document.getElementById('comparison-chart');

    // Destroy existing chart if any
    if (comparisonChart) {
        comparisonChart.destroy();
    }

    // Normalize values for better visualization
    const maxWinRate = Math.max(fighter1.win_rate, fighter2.win_rate);
    const maxFights = Math.max(fighter1.career_fights, fighter2.career_fights);
    const maxStrikes = Math.max(fighter1.avg_strikes, fighter2.avg_strikes);
    const maxTakedowns = Math.max(fighter1.avg_takedowns, fighter2.avg_takedowns);
    const maxKnockdowns = Math.max(fighter1.avg_knockdowns, fighter2.avg_knockdowns);

    comparisonChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Win Rate', 'Experience', 'Striking', 'Takedowns', 'Knockdowns'],
            datasets: [{
                label: fighter1.name,
                data: [
                    (fighter1.win_rate / maxWinRate) * 100,
                    (fighter1.career_fights / maxFights) * 100,
                    (fighter1.avg_strikes / maxStrikes) * 100,
                    (fighter1.avg_takedowns / maxTakedowns) * 100,
                    (fighter1.avg_knockdowns / maxKnockdowns) * 100
                ],
                backgroundColor: 'rgba(102, 126, 234, 0.2)',
                borderColor: 'rgba(102, 126, 234, 1)',
                borderWidth: 2
            }, {
                label: fighter2.name,
                data: [
                    (fighter2.win_rate / maxWinRate) * 100,
                    (fighter2.career_fights / maxFights) * 100,
                    (fighter2.avg_strikes / maxStrikes) * 100,
                    (fighter2.avg_takedowns / maxTakedowns) * 100,
                    (fighter2.avg_knockdowns / maxKnockdowns) * 100
                ],
                backgroundColor: 'rgba(230, 57, 70, 0.2)',
                borderColor: 'rgba(230, 57, 70, 1)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        stepSize: 20
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Display Prediction
function displayPrediction(data, fighter1, fighter2) {
    const resultDiv = document.getElementById('result');

    // Main prediction text
    document.getElementById('predictionText').textContent = data.prediction;

    // Confidence meter
    const confidenceFill = document.getElementById('confidence-fill');
    const confidenceLevel = data.confidence_level * 100;
    confidenceFill.style.width = \`\${confidenceLevel}%\`;

    document.getElementById('confidence-info').textContent =
        \`Confidence Level: \${confidenceLevel.toFixed(1)}%\`;

    // Probability split
    const winProb = data.win_probability * 100;
    const loseProb = (1 - data.win_probability) * 100;

    if (data.winner === fighter1) {
        document.getElementById('fighter1-prob-name').textContent = fighter1;
        document.getElementById('fighter1-prob-value').textContent = \`\${winProb.toFixed(1)}%\`;
        document.getElementById('fighter2-prob-name').textContent = fighter2;
        document.getElementById('fighter2-prob-value').textContent = \`\${loseProb.toFixed(1)}%\`;
    } else {
        document.getElementById('fighter1-prob-name').textContent = fighter1;
        document.getElementById('fighter1-prob-value').textContent = \`\${loseProb.toFixed(1)}%\`;
        document.getElementById('fighter2-prob-name').textContent = fighter2;
        document.getElementById('fighter2-prob-value').textContent = \`\${winProb.toFixed(1)}%\`;
    }

    // Weight class info
    document.getElementById('weight-class-info').textContent =
        \`Weight Class: \${data.weight_class}\`;

    // Model details
    if (data.model_details) {
        document.getElementById('prediction-method').textContent =
            \`Prediction Method: \${data.model_details.prediction_method}\`;
        document.getElementById('model-confidences').textContent =
            \`Red Model Confidence: \${(data.model_details.red_model_confidence * 100).toFixed(1)}% | \` +
            \`Blue Model Confidence: \${(data.model_details.blue_model_confidence * 100).toFixed(1)}%\`;
        document.getElementById('fighter-order-info').textContent =
            \`Fighter Order Randomized: \${data.fighter_order_randomized ? 'Yes' : 'No'}\`;
    }

    resultDiv.classList.remove('hidden');
}

function toggleModelDetails() {
    const details = document.getElementById('model-details');
    const button = document.getElementById('toggle-details');

    if (details.classList.contains('hidden')) {
        details.classList.remove('hidden');
        button.textContent = 'Hide Model Details';
    } else {
        details.classList.add('hidden');
        button.textContent = 'Show Model Details';
    }
}

// Prediction History
function savePrediction() {
    if (!currentPrediction) return;

    let history = JSON.parse(localStorage.getItem('predictionHistory') || '[]');
    history.unshift(currentPrediction);

    // Keep only last 10 predictions
    if (history.length > 10) {
        history = history.slice(0, 10);
    }

    localStorage.setItem('predictionHistory', JSON.stringify(history));
    loadPredictionHistory();

    // Show confirmation
    alert('Prediction saved to history!');
}

function loadPredictionHistory() {
    const history = JSON.parse(localStorage.getItem('predictionHistory') || '[]');
    const historyDiv = document.getElementById('prediction-history');
    const clearBtn = document.getElementById('clear-history');

    if (history.length === 0) {
        historyDiv.innerHTML = '<p class="no-history">No predictions yet. Make your first prediction above!</p>';
        clearBtn.classList.add('hidden');
        return;
    }

    historyDiv.innerHTML = history.map(pred => \`
        <div class="history-item">
            <div class="history-item-header">
                <span class="history-winner">🏆 \${pred.winner}</span>
                <span class="history-timestamp">\${new Date(pred.timestamp).toLocaleDateString()}</span>
            </div>
            <p class="history-matchup">\${pred.fighter1} vs \${pred.fighter2}</p>
            <p class="history-probability">Win Probability: \${(pred.win_probability * 100).toFixed(1)}%</p>
        </div>
    \`).join('');

    clearBtn.classList.remove('hidden');
}

function clearHistory() {
    if (confirm('Are you sure you want to clear all prediction history?')) {
        localStorage.removeItem('predictionHistory');
        loadPredictionHistory();
    }
}

// Error Display
function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');

    document.getElementById('result').classList.add('hidden');
    document.getElementById('fighter-comparison').classList.add('hidden');

    setTimeout(() => {
        errorDiv.classList.add('hidden');
    }, 5000);
}
