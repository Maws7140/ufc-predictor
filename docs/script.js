// Mock fighter data for GitHub Pages demo
const mockFighters = [
    { name: "Jon Jones", weightClasses: ["Light Heavyweight", "Heavyweight"] },
    { name: "Daniel Cormier", weightClasses: ["Light Heavyweight", "Heavyweight"] },
    { name: "Conor McGregor", weightClasses: ["Featherweight", "Lightweight", "Welterweight"] },
    { name: "Nate Diaz", weightClasses: ["Lightweight", "Welterweight"] },
    { name: "Anderson Silva", weightClasses: ["Middleweight", "Light Heavyweight"] },
    { name: "Chael Sonnen", weightClasses: ["Middleweight", "Light Heavyweight"] },
    { name: "Francis Ngannou", weightClasses: ["Heavyweight"] },
    { name: "Stipe Miocic", weightClasses: ["Heavyweight"] },
    { name: "Khabib Nurmagomedov", weightClasses: ["Lightweight"] },
    { name: "Tony Ferguson", weightClasses: ["Lightweight"] },
    { name: "Israel Adesanya", weightClasses: ["Middleweight", "Light Heavyweight"] },
    { name: "Robert Whittaker", weightClasses: ["Middleweight"] },
    { name: "Kamaru Usman", weightClasses: ["Welterweight"] },
    { name: "Colby Covington", weightClasses: ["Welterweight"] },
    { name: "Max Holloway", weightClasses: ["Featherweight"] },
    { name: "Alexander Volkanovski", weightClasses: ["Featherweight"] },
    { name: "Aljamain Sterling", weightClasses: ["Bantamweight"] },
    { name: "Petr Yan", weightClasses: ["Bantamweight"] },
    { name: "Deiveson Figueiredo", weightClasses: ["Flyweight"] },
    { name: "Brandon Moreno", weightClasses: ["Flyweight"] }
];

// Mock prediction data
const mockPredictions = {
    "Jon Jones vs Daniel Cormier": {
        winner: "Jon Jones",
        probability: 0.652,
        confidence: 0.304,
        details: {
            red_confidence: 0.73,
            blue_confidence: 0.69,
            method: "weighted"
        }
    },
    "Conor McGregor vs Nate Diaz": {
        winner: "Conor McGregor",
        probability: 0.589,
        confidence: 0.178,
        details: {
            red_confidence: 0.61,
            blue_confidence: 0.58,
            method: "simple_average"
        }
    },
    "Anderson Silva vs Chael Sonnen": {
        winner: "Anderson Silva",
        probability: 0.734,
        confidence: 0.468,
        details: {
            red_confidence: 0.78,
            blue_confidence: 0.72,
            method: "weighted"
        }
    },
    "Francis Ngannou vs Stipe Miocic": {
        winner: "Francis Ngannou",
        probability: 0.612,
        confidence: 0.224,
        details: {
            red_confidence: 0.65,
            blue_confidence: 0.62,
            method: "simple_average"
        }
    },
    "Khabib Nurmagomedov vs Tony Ferguson": {
        winner: "Khabib Nurmagomedov",
        probability: 0.687,
        confidence: 0.374,
        details: {
            red_confidence: 0.71,
            blue_confidence: 0.68,
            method: "weighted"
        }
    },
    "Israel Adesanya vs Robert Whittaker": {
        winner: "Israel Adesanya",
        probability: 0.623,
        confidence: 0.246,
        details: {
            red_confidence: 0.64,
            blue_confidence: 0.61,
            method: "simple_average"
        }
    }
};

// DOM elements
const weightClassSelect = document.getElementById('weight-class');
const fighter1Input = document.getElementById('fighter1');
const fighter2Input = document.getElementById('fighter2');
const fighter1Suggestions = document.getElementById('fighter1-suggestions');
const fighter2Suggestions = document.getElementById('fighter2-suggestions');
const fighter1WeightClasses = document.getElementById('fighter1-weight-classes');
const fighter2WeightClasses = document.getElementById('fighter2-weight-classes');
const predictBtn = document.getElementById('predictBtn');
const loading = document.getElementById('loading');
const result = document.getElementById('result');
const error = document.getElementById('error');
const predictionText = document.getElementById('predictionText');
const confidenceInfo = document.getElementById('confidence-info');
const weightClassInfo = document.getElementById('weight-class-info');
const modelDetails = document.getElementById('model-details');
const predictionMethod = document.getElementById('prediction-method');
const modelConfidences = document.getElementById('model-confidences');
const fighterOrderInfo = document.getElementById('fighter-order-info');
const toggleDetailsBtn = document.getElementById('toggle-details');

// Utility functions
function normalizeString(str) {
    return str.toLowerCase().trim();
}

function getFilteredFighters(weightClass = 'All') {
    if (weightClass === 'All') {
        return mockFighters;
    }
    return mockFighters.filter(fighter => 
        fighter.weightClasses.includes(weightClass)
    );
}

function findFighter(name) {
    return mockFighters.find(fighter => 
        normalizeString(fighter.name) === normalizeString(name)
    );
}

function showSuggestions(input, suggestionsDiv, fighters) {
    const query = normalizeString(input.value);
    suggestionsDiv.innerHTML = '';
    
    if (query.length < 2) {
        suggestionsDiv.style.display = 'none';
        return;
    }
    
    const matches = fighters.filter(fighter => 
        normalizeString(fighter.name).includes(query)
    ).slice(0, 5);
    
    if (matches.length > 0) {
        matches.forEach(fighter => {
            const suggestion = document.createElement('div');
            suggestion.className = 'suggestion';
            suggestion.textContent = fighter.name;
            suggestion.onclick = () => {
                input.value = fighter.name;
                suggestionsDiv.style.display = 'none';
                showFighterWeightClasses(fighter.name);
            };
            suggestionsDiv.appendChild(suggestion);
        });
        suggestionsDiv.style.display = 'block';
    } else {
        suggestionsDiv.style.display = 'none';
    }
}

function showFighterWeightClasses(fighterName) {
    const fighter = findFighter(fighterName);
    if (fighter) {
        const weightClassDiv = fighterName === fighter1Input.value ? 
            fighter1WeightClasses : fighter2WeightClasses;
        
        weightClassDiv.innerHTML = `
            <small>Weight classes: ${fighter.weightClasses.join(', ')}</small>
        `;
        weightClassDiv.classList.remove('hidden');
    }
}

function hideSuggestions() {
    setTimeout(() => {
        fighter1Suggestions.style.display = 'none';
        fighter2Suggestions.style.display = 'none';
    }, 150);
}

function showResult(predictionData) {
    predictionText.textContent = predictionData.prediction;
    
    const confidenceLevel = predictionData.confidence_level;
    let confidenceText = '';
    if (confidenceLevel > 0.4) {
        confidenceText = 'High confidence';
    } else if (confidenceLevel > 0.2) {
        confidenceText = 'Medium confidence';
    } else {
        confidenceText = 'Low confidence';
    }
    
    confidenceInfo.textContent = `Confidence: ${confidenceText} (${(confidenceLevel * 100).toFixed(1)}%)`;
    weightClassInfo.textContent = `Weight Class: ${predictionData.weight_class}`;
    
    // Model details
    const details = predictionData.model_details;
    predictionMethod.textContent = `Prediction Method: ${details.prediction_method || 'weighted'}`;
    modelConfidences.textContent = `Model Confidences - Red: ${((details.red_model_confidence || 0.7) * 100).toFixed(1)}%, Blue: ${((details.blue_model_confidence || 0.69) * 100).toFixed(1)}%`;
    fighterOrderInfo.textContent = `Fighter Order Randomized: ${predictionData.fighter_order_randomized ? 'Yes' : 'No'}`;
    
    result.classList.remove('hidden');
    loading.classList.add('hidden');
    error.classList.add('hidden');
}

function showError(message) {
    error.textContent = message;
    error.classList.remove('hidden');
    result.classList.add('hidden');
    loading.classList.add('hidden');
}

function getPredictionKey(fighter1, fighter2) {
    // Try both orders to find a match
    const key1 = `${fighter1} vs ${fighter2}`;
    const key2 = `${fighter2} vs ${fighter1}`;
    
    if (mockPredictions[key1]) return key1;
    if (mockPredictions[key2]) return key2;
    return null;
}

function generateMockPrediction(fighter1, fighter2, weightClass) {
    // Generate a realistic mock prediction
    const probability = 0.55 + Math.random() * 0.3; // Between 0.55 and 0.85
    const winner = Math.random() > 0.5 ? fighter1 : fighter2;
    const winProb = winner === fighter1 ? probability : (1 - probability);
    const confidence = Math.abs(winProb - 0.5) * 2;
    
    return {
        prediction: `${winner} is predicted to win with ${(winProb * 100).toFixed(1)}% probability`,
        winner: winner,
        win_probability: winProb,
        confidence_level: confidence,
        weight_class: weightClass,
        fighter_order_randomized: Math.random() > 0.5,
        model_details: {
            red_model_confidence: 0.6 + Math.random() * 0.3,
            blue_model_confidence: 0.6 + Math.random() * 0.3,
            prediction_method: Math.random() > 0.5 ? 'weighted' : 'simple_average'
        }
    };
}

async function makePrediction() {
    const fighter1 = fighter1Input.value.trim();
    const fighter2 = fighter2Input.value.trim();
    const weightClass = weightClassSelect.value;
    
    // Validation
    if (!fighter1 || !fighter2) {
        showError('Please enter both fighter names.');
        return;
    }
    
    if (normalizeString(fighter1) === normalizeString(fighter2)) {
        showError('Please select two different fighters.');
        return;
    }
    
    // Check if fighters exist
    const f1 = findFighter(fighter1);
    const f2 = findFighter(fighter2);
    
    if (!f1 || !f2) {
        showError('One or both fighters not found. Try selecting from the suggestions.');
        return;
    }
    
    // Weight class validation
    if (weightClass !== 'All') {
        if (!f1.weightClasses.includes(weightClass) || !f2.weightClasses.includes(weightClass)) {
            showError(`Both fighters must compete in ${weightClass}. Please check their weight classes.`);
            return;
        }
    }
    
    loading.classList.remove('hidden');
    result.classList.add('hidden');
    error.classList.add('hidden');
    
    // Simulate API delay
    setTimeout(() => {
        const predictionKey = getPredictionKey(fighter1, fighter2);
        let predictionData;
        
        if (predictionKey && mockPredictions[predictionKey]) {
            // Use predefined prediction
            const mock = mockPredictions[predictionKey];
            predictionData = {
                prediction: `${mock.winner} is predicted to win with ${(mock.probability * 100).toFixed(1)}% probability`,
                winner: mock.winner,
                win_probability: mock.probability,
                confidence_level: mock.confidence,
                weight_class: weightClass === 'All' ? 'Mixed' : weightClass,
                fighter_order_randomized: Math.random() > 0.5,
                model_details: mock.details
            };
        } else {
            // Generate mock prediction
            predictionData = generateMockPrediction(fighter1, fighter2, weightClass === 'All' ? 'Mixed' : weightClass);
        }
        
        showResult(predictionData);
    }, 1500);
}

// Event listeners
weightClassSelect.addEventListener('change', () => {
    // Clear inputs when weight class changes
    fighter1Input.value = '';
    fighter2Input.value = '';
    fighter1WeightClasses.classList.add('hidden');
    fighter2WeightClasses.classList.add('hidden');
});

fighter1Input.addEventListener('input', () => {
    const weightClass = weightClassSelect.value;
    const filteredFighters = getFilteredFighters(weightClass);
    showSuggestions(fighter1Input, fighter1Suggestions, filteredFighters);
});

fighter2Input.addEventListener('input', () => {
    const weightClass = weightClassSelect.value;
    const filteredFighters = getFilteredFighters(weightClass);
    showSuggestions(fighter2Input, fighter2Suggestions, filteredFighters);
});

fighter1Input.addEventListener('blur', () => {
    hideSuggestions();
    if (fighter1Input.value) {
        showFighterWeightClasses(fighter1Input.value);
    }
});

fighter2Input.addEventListener('blur', () => {
    hideSuggestions();
    if (fighter2Input.value) {
        showFighterWeightClasses(fighter2Input.value);
    }
});

predictBtn.addEventListener('click', makePrediction);

toggleDetailsBtn.addEventListener('click', () => {
    if (modelDetails.classList.contains('hidden')) {
        modelDetails.classList.remove('hidden');
        toggleDetailsBtn.textContent = 'Hide Details';
    } else {
        modelDetails.classList.add('hidden');
        toggleDetailsBtn.textContent = 'Show Details';
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('UFC Predictor Demo initialized with', mockFighters.length, 'fighters');
    
    // Verify all required elements are present
    const requiredElements = ['fighter1', 'fighter2', 'predictBtn', 'weight-class'];
    const missingElements = requiredElements.filter(id => !document.getElementById(id));
    
    if (missingElements.length > 0) {
        console.error('Missing required elements:', missingElements);
    } else {
        console.log('All required elements found - app should be functional');
    }
});