// ===== GLOBAL STATE =====
const AppState = {
    currentScreen: 'homeScreen',
    selectedTest: null,
    currentTestType: null,
    testData: {
        reactionTimes: [],
        correctResponses: 0,
        totalTrials: 0,
        errors: 0,
        score: 0,
        startTime: null,
        endTime: null
    },
    factors: {
        stress: null,
        fatigue: null,
        age: null
    },
    sessions: [],
    isTestRunning: false
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    loadSessionsFromStorage();
    setupEventListeners();
    applyDarkModePreference();
});

// ===== DARK MODE =====
function setupEventListeners() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', toggleDarkMode);
    }

    const historyBtn = document.getElementById('historyBtn');
    if (historyBtn) {
        historyBtn.addEventListener('click', showHistory);
    }

    // Factor sliders
    const stressSlider = document.getElementById('stressSlider');
    const fatigueSlider = document.getElementById('fatigueSlider');
    const ageInput = document.getElementById('ageInput');

    if (stressSlider) {
        stressSlider.addEventListener('input', (e) => {
            AppState.factors.stress = parseInt(e.target.value);
            updateStressLabel();
            document.getElementById('stressValue').textContent = e.target.value;
        });
    }

    if (fatigueSlider) {
        fatigueSlider.addEventListener('input', (e) => {
            AppState.factors.fatigue = parseInt(e.target.value);
            updateFatigueLabel();
            document.getElementById('fatigueValue').textContent = e.target.value;
        });
    }

    if (ageInput) {
        ageInput.addEventListener('change', (e) => {
            AppState.factors.age = e.target.value ? parseInt(e.target.value) : null;
            document.getElementById('ageValue').textContent = e.target.value || '-';
        });
    }
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    updateModeIcon();
}

function updateModeIcon() {
    const modeIcon = document.getElementById('modeIcon');
    // Keep consistent transparency effect in both modes
    modeIcon.style.opacity = '0.6';
}

function applyDarkModePreference() {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    if (darkMode) {
        document.body.classList.add('dark-mode');
    }
    updateModeIcon();
}

// ===== SCREEN NAVIGATION =====
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
        AppState.currentScreen = screenId;
        window.scrollTo(0, 0);
    }
}

function goHome() {
    resetFactors();
    AppState.selectedTest = null;
    AppState.currentTestType = null;
    AppState.isTestRunning = false;
    showScreen('homeScreen');
}

function showTestSelection(testType) {
    AppState.currentTestType = testType;
    
    const testCategories = {
        'reaction-attention': {
            title: 'Reaction & Attention Tests',
            tests: [
                {
                    id: 'simple-reaction',
                    name: 'Simple Reaction Time',
                    desc: 'Click the target shape as quickly as possible.'
                },
                {
                    id: 'go-no-go',
                    name: 'Go/No-Go Test',
                    desc: 'Respond only to Go stimuli, inhibit response to No-Go.'
                },
                {
                    id: 'stroop-reaction',
                    name: 'Stroop-like Reaction',
                    desc: 'Select the color of text, not the word itself.'
                },
                {
                    id: 'target-distractors',
                    name: 'Target vs Distractors',
                    desc: 'Click the target shape among multiple distractors.'
                }
            ]
        },
        'working-memory': {
            title: 'Working Memory Tests',
            tests: [
                {
                    id: 'n-back',
                    name: 'N-Back Test',
                    desc: 'Click when current item matches N items back.'
                },
                {
                    id: 'sequence-memory',
                    name: 'Sequence Memory',
                    desc: 'Reproduce a sequence of items in order.'
                },
                {
                    id: 'spatial-memory',
                    name: 'Spatial Memory',
                    desc: 'Click positions on a grid in the order they appeared.'
                }
            ]
        },
        'executive-function': {
            title: 'Executive Function Tests',
            tests: [
                {
                    id: 'decision-making',
                    name: 'Simple Decision-Making',
                    desc: 'Select the correct option under time pressure.'
                },
                {
                    id: 'task-switching',
                    name: 'Task Switching',
                    desc: 'Switch between different rules during the test.'
                }
            ]
        }
    };

    const category = testCategories[testType];
    document.getElementById('testCategoryTitle').textContent = `Select a ${category.title}`;

    const container = document.getElementById('testSelectionContainer');
    container.innerHTML = '';

    category.tests.forEach(test => {
        const card = document.createElement('div');
        card.className = 'test-card';
        card.innerHTML = `<h3>${test.name}</h3><p>${test.desc}</p>`;
        card.onclick = () => selectTest(test.id, test.name);
        container.appendChild(card);
    });

    showScreen('testSelectionScreen');
}

function selectTest(testId, testName) {
    AppState.selectedTest = testId;
    loadInstructions(testId, testName);
    showScreen('instructionsScreen');
}

// ===== INSTRUCTIONS =====
function loadInstructions(testId, testName) {
    document.getElementById('instructionsTitle').textContent = `Get Ready: ${testName}`;
}

function getTestInstructions(testId) {
    const instructions = {
        'simple-reaction': {
            text: `
                <h3>Simple Reaction Time Test</h3>
                <p>Test your ability to respond quickly to a visual stimulus.</p>
                <h4>Procedure:</h4>
                <ol>
                    <li>Click "Start" to begin</li>
                    <li>One of three shapes will appear at random positions: circle, square, or rectangle</li>
                    <li>The TARGET shape will be indicated before each trial (e.g., "Click the CIRCLE")</li>
                    <li>Click ONLY the target shape as quickly as possible</li>
                    <li>Clicking other shapes counts as an error</li>
                    <li>10 trials total with 2-second intervals</li>
                </ol>
                <h4>Tips:</h4>
                <ul>
                    <li>Stay focused on the target shape</li>
                    <li>React as fast as you can</li>
                    <li>Accuracy matters - avoid clicking wrong shapes</li>
                </ul>
            `,
            example: `
                <h4>Example Sequence:</h4>
                <p>1. You see: "Click the SQUARE"</p>
                <p>2. After 1-2 seconds, shapes appear randomly on screen</p>
                <p>3. You see a square, circle, and rectangle</p>
                <p>4. You click the square: "Correct! 245ms"</p>
                <p>5. Next trial after 2 seconds</p>
            `
        },
        'go-no-go': {
            text: `
                <h3>Go/No-Go Test</h3>
                <p>Test your ability to respond selectively and inhibit responses appropriately.</p>
                <h4>Procedure:</h4>
                <ol>
                    <li>Click "Start" to begin</li>
                    <li>The GO stimulus will be indicated (e.g., "Red Circle is GO")</li>
                    <li>All other colors/shapes are NO-GO</li>
                    <li>When you see the GO stimulus, click immediately</li>
                    <li>When you see a NO-GO stimulus, do NOT click</li>
                    <li>20 trials with random order (~70% Go, ~30% No-Go)</li>
                </ol>
                <h4>Scoring:</h4>
                <ul>
                    <li>Hit: Correctly clicked Go stimulus</li>
                    <li>Commission Error: Clicked No-Go stimulus (mistake)</li>
                    <li>Omission Error: Missed Go stimulus</li>
                </ul>
            `,
            example: `
                <h4>Example Sequence:</h4>
                <p>1. You see: "GO stimulus: Red Circle | NO-GO: Any other color or shape"</p>
                <p>2. Red circle appears → Click immediately: "Hit! 290ms"</p>
                <p>3. Blue square appears → You wait: "Correct rejection!"</p>
                <p>4. Next stimulus after 1 second</p>
            `
        },
        'stroop-reaction': {
            text: `
                <h3>Stroop-like Reaction Test</h3>
                <p>Test your ability to overcome the automatic reading response and focus on color.</p>
                <h4>Procedure:</h4>
                <ol>
                    <li>Click "Start" to begin</li>
                    <li>Color words (RED, BLUE, GREEN, YELLOW) appear in mismatched ink colors</li>
                    <li>Click/select the COLOR OF THE INK, not the word</li>
                    <li>Words appear at random positions on screen</li>
                    <li>15 trials total</li>
                </ol>
                <h4>Challenge:</h4>
                <ul>
                    <li>Your brain automatically tries to read the word</li>
                    <li>You must focus on the actual color of the text</li>
                    <li>This conflict slows your reaction - that is normal!</li>
                </ul>
            `,
            example: `
                <h4>Example Sequence:</h4>
                <p>1. You see the word "BLUE" printed in RED ink</p>
                <p>2. Your task: Click the RED button (not blue)</p>
                <p>3. Correct click: "Correct! 450ms"</p>
                <p>4. Word "GREEN" appears in YELLOW ink → Click yellow button</p>
            `
        },
        'target-distractors': {
            text: `
                <h3>Target vs Distractors Test</h3>
                <p>Test your ability to locate and select a target among multiple distractors.</p>
                <h4>Procedure:</h4>
                <ol>
                    <li>Click "Start" to begin</li>
                    <li>The target shape will be specified (e.g., "Find the BLUE CIRCLE")</li>
                    <li>Multiple shapes appear simultaneously on screen</li>
                    <li>Click ONLY the target shape</li>
                    <li>Distractors vary in shape, color, and position</li>
                    <li>12 trials with increasing complexity</li>
                </ol>
                <h4>Difficulty Increases:</h4>
                <ul>
                    <li>Early trials: few distractors (3-4 shapes)</li>
                    <li>Later trials: more distractors (5-8 shapes)</li>
                </ul>
            `,
            example: `
                <h4>Example Sequence:</h4>
                <p>1. You see: "Find the BLUE CIRCLE"</p>
                <p>2. Screen shows: red square, green circle, blue circle, yellow triangle</p>
                <p>3. You click the blue circle: "Correct! 380ms"</p>
                <p>4. Next trial with new target and distractors</p>
            `
        },
        'n-back': {
            text: `
                <h3>N-Back Test</h3>
                <p>Test your working memory by matching current items to items N positions back.</p>
                <h4>Procedure:</h4>
                <ol>
                    <li>Click "Start" to begin (N=1: match to previous item)</li>
                    <li>Shapes appear one at a time in sequence</li>
                    <li>Click when current shape matches the one from N positions back</li>
                    <li>Do NOT click if it doesn't match</li>
                    <li>20 trials total</li>
                </ol>
                <h4>Important:</h4>
                <ul>
                    <li>You must remember the previous item</li>
                    <li>Compare new item to item N steps back</li>
                    <li>Only click if they match exactly</li>
                </ul>
            `,
            example: `
                <h4>Example Sequence (N=1):</h4>
                <p>1. Circle appears → Nothing to match, no click</p>
                <p>2. Square appears → Doesn't match circle, no click</p>
                <p>3. Square appears → Matches previous square, CLICK!</p>
                <p>4. Circle appears → Doesn't match square, no click</p>
                <p>5. Circle appears → Matches previous circle, CLICK!</p>
            `
        },
        'sequence-memory': {
            text: `
                <h3>Sequence Memory Test</h3>
                <p>Remember and reproduce a sequence of items in the correct order.</p>
                <h4>Procedure:</h4>
                <ol>
                    <li>Click "Start" to begin</li>
                    <li>A sequence of shapes (4-7 items) appears one at a time</li>
                    <li>Study and remember the sequence</li>
                    <li>After sequence ends, click shapes in the EXACT same order</li>
                    <li>5 different sequences to complete</li>
                </ol>
                <h4>Scoring:</h4>
                <ul>
                    <li>1 point per correct sequence</li>
                    <li>Partial credit if you get part of sequence right</li>
                </ul>
            `,
            example: `
                <h4>Example Sequence:</h4>
                <p>1. You see: Circle → Square → Triangle → Circle (flashes)</p>
                <p>2. Sequence ends, options appear as clickable buttons</p>
                <p>3. You click: Circle → Square → Triangle → Circle</p>
                <p>4. "Correct! Full sequence matched"</p>
                <p>5. Next sequence appears</p>
            `
        },
        'spatial-memory': {
            text: `
                <h3>Spatial Memory Test</h3>
                <p>Remember positions where shapes appeared and click them in order.</p>
                <h4>Procedure:</h4>
                <ol>
                    <li>Click "Start" to begin</li>
                    <li>A grid appears with shapes lighting up one at a time</li>
                    <li>Remember the ORDER of positions</li>
                    <li>After sequence ends, click grid positions in the same order</li>
                    <li>5 trials with 4-6 positions each</li>
                </ol>
                <h4>Visual-Spatial Challenge:</h4>
                <ul>
                    <li>Focus on LOCATION not shape</li>
                    <li>Remember exact grid positions</li>
                    <li>Complexity increases each trial</li>
                </ul>
            `,
            example: `
                <h4>Example Sequence:</h4>
                <p>1. You see a 3×3 grid with positions lighting up: top-left → center → bottom-right</p>
                <p>2. Sequence ends, grid reappears</p>
                <p>3. You click: top-left → center → bottom-right</p>
                <p>4. "Correct! 3 of 3 positions matched"</p>
            `
        },
        'decision-making': {
            text: `
                <h3>Simple Decision-Making Test</h3>
                <p>Select the correct option under time pressure.</p>
                <h4>Procedure:</h4>
                <ol>
                    <li>Click "Start" to begin</li>
                    <li>A question appears with 3-4 answer options</li>
                    <li>Select the correct answer as quickly as possible</li>
                    <li>You have 8 seconds per question</li>
                    <li>15 questions total (varying difficulty)</li>
                </ol>
                <h4>Scoring:</h4>
                <ul>
                    <li>Speed and accuracy both matter</li>
                    <li>Faster correct answers earn higher scores</li>
                    <li>Wrong answers count as errors</li>
                </ul>
            `,
            example: `
                <h4>Example Trial:</h4>
                <p>Question: "Which shape has 4 equal sides?"</p>
                <p>Options: A) Circle  B) Square  C) Triangle</p>
                <p>You click: B) Square → "Correct! 1.2 seconds"</p>
                <p>Next question appears</p>
            `
        },
        'task-switching': {
            text: `
                <h3>Task Switching / Mental Flexibility Test</h3>
                <p>Test your ability to switch between different rules quickly.</p>
                <h4>Procedure:</h4>
                <ol>
                    <li>Click "Start" to begin</li>
                    <li>Round 1: Click shapes based on COLOR rule (e.g., "Click all red shapes")</li>
                    <li>Round 2: Switch to SHAPE rule (e.g., "Click all circles")</li>
                    <li>Rounds alternate every 8 trials</li>
                    <li>20 trials total (10 per rule)</li>
                </ol>
                <h4>Errors:</h4>
                <ul>
                    <li>Following the old rule by mistake (perseveration error)</li>
                    <li>Failing to switch rules when prompted</li>
                    <li>Clicking wrong shapes</li>
                </ul>
            `,
            example: `
                <h4>Example Sequence:</h4>
                <p>Round 1 (Color Rule): "Click RED shapes"</p>
                <p>You see red circle, blue square, red triangle → Click both red shapes</p>
                <p>Round 2 (Switch to Shape Rule): "Click CIRCLES"</p>
                <p>You see red circle, blue circle, red square → Click both circles</p>
                <p>Error: If you keep clicking based on color when rule changed</p>
            `
        }
    };

    return instructions[testId] || { text: '<p>No instructions found.</p>', example: '' };
}

// ===== FACTOR INPUT =====
function toggleFactorPanel() {
    const factorInputs = document.getElementById('factorInputs');
    if (factorInputs) {
        factorInputs.style.display = factorInputs.style.display === 'none' ? 'block' : 'none';
    }
}

function updateStressLabel() {
    const stress = AppState.factors.stress || 0;
    const label = document.getElementById('stressLabel');
    if (stress <= 30) {
        label.textContent = 'Low Stress';
    } else if (stress <= 70) {
        label.textContent = 'Medium Stress';
    } else {
        label.textContent = 'High Stress';
    }
}

function updateFatigueLabel() {
    const fatigue = AppState.factors.fatigue || 0;
    const label = document.getElementById('fatigueLabel');
    if (fatigue <= 30) {
        label.textContent = 'Well-rested';
    } else if (fatigue <= 70) {
        label.textContent = 'Tired';
    } else {
        label.textContent = 'Very Tired';
    }
}

function resetFactors() {
    AppState.factors = { stress: null, fatigue: null, age: null };
    document.getElementById('stressSlider').value = 0;
    document.getElementById('fatigueSlider').value = 0;
    document.getElementById('ageInput').value = '';
    document.getElementById('stressValue').textContent = '0';
    document.getElementById('fatigueValue').textContent = '0';
    document.getElementById('ageValue').textContent = '-';
    updateStressLabel();
    updateFatigueLabel();
}

function clearFactors() {
    resetFactors();
}

// ===== TEST EXECUTION =====
function startTest() {
    if (!AppState.selectedTest) return;

    AppState.isTestRunning = true;
    AppState.testData = {
        reactionTimes: [],
        correctResponses: 0,
        totalTrials: 0,
        errors: 0,
        score: 0,
        startTime: Date.now(),
        endTime: null
    };

    showScreen('testScreen');

    switch (AppState.selectedTest) {
        case 'simple-reaction':
            runSimpleReactionTest();
            break;
        case 'go-no-go':
            runGoNoGoTest();
            break;
        case 'stroop-reaction':
            runStroopReactionTest();
            break;
        case 'target-distractors':
            runTargetDistractorsTest();
            break;
        case 'n-back':
            runNBackTest();
            break;
        case 'sequence-memory':
            runSequenceMemoryTest();
            break;
        case 'spatial-memory':
            runSpatialMemoryTest();
            break;
        case 'decision-making':
            runDecisionMakingTest();
            break;
        case 'task-switching':
            runTaskSwitchingTest();
            break;
    }
}

// ===== SIMPLE REACTION TEST =====
function runSimpleReactionTest() {
    const container = document.getElementById('testContainer');
    const shapes = ['circle', 'square', 'rectangle'];
    const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#A8E6CF', '#FF8B94', '#FFD3B6'];
    const numTrials = 10;
    let currentTrial = 0;
    let trialStartTime = null;

    function getRandomShape() {
        return shapes[Math.floor(Math.random() * shapes.length)];
    }

    function getRandomPosition() {
        return {
            x: Math.random() * 60 + 20, // 20% to 80% from left
            y: Math.random() * 60 + 20  // 20% to 80% from top
        };
    }

    function drawShape(type, x, y, color) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100');
        svg.setAttribute('height', '100');
        svg.style.position = 'absolute';
        svg.style.left = x + '%';
        svg.style.top = y + '%';
        svg.style.transform = 'translate(-50%, -50%)';

        let shape;
        if (type === 'circle') {
            shape = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            shape.setAttribute('cx', '50');
            shape.setAttribute('cy', '50');
            shape.setAttribute('r', '40');
        } else if (type === 'square') {
            shape = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            shape.setAttribute('x', '10');
            shape.setAttribute('y', '10');
            shape.setAttribute('width', '80');
            shape.setAttribute('height', '80');
        } else {
            shape = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            shape.setAttribute('x', '5');
            shape.setAttribute('y', '25');
            shape.setAttribute('width', '90');
            shape.setAttribute('height', '50');
        }

        shape.setAttribute('fill', color);
        shape.setAttribute('stroke', '#333');
        shape.setAttribute('stroke-width', '2');
        svg.appendChild(shape);

        return svg;
    }

    function runTrial() {
        if (currentTrial >= numTrials) {
            endTest();
            return;
        }

        currentTrial++;
        AppState.testData.totalTrials++;
        updateProgress(currentTrial, numTrials);

        const targetShape = getRandomShape();
        const position = getRandomPosition();

        container.innerHTML = `
            <p style="font-size: 1.2rem; color: #999; margin-bottom: 1.5rem;">Click the <strong>${targetShape.toUpperCase()}</strong></p>
            <div style="position: relative; width: 100%; height: 300px; background: #f5f5f5; border-radius: 8px; margin: 1rem 0;"></div>
        `;

        const canvasDiv = container.querySelector('div');
        canvasDiv.style.position = 'relative';

        // Add target shape
        const targetColor = colors[Math.floor(Math.random() * colors.length)];
        const targetShape1 = drawShape(targetShape, position.x, position.y, targetColor);
        targetShape1.style.cursor = 'pointer';
        targetShape1.onclick = () => {
            const reactionTime = Date.now() - trialStartTime;
            AppState.testData.reactionTimes.push(reactionTime);
            AppState.testData.correctResponses++;
            AppState.testData.score++;

            container.innerHTML += `<div class="feedback correct">✓ Correct! ${reactionTime}ms</div>`;

            setTimeout(() => runTrial(), 800);
        };
        canvasDiv.appendChild(targetShape1);

        // Add distractor shapes
        const distractorShapes = shapes.filter(s => s !== targetShape);
        distractorShapes.forEach(distractor => {
            const distPos = getRandomPosition();
            const distColor = colors[Math.floor(Math.random() * colors.length)];
            const distShape = drawShape(distractor, distPos.x, distPos.y, distColor);
            distShape.style.cursor = 'pointer';
            distShape.onclick = () => {
                AppState.testData.errors++;
                container.innerHTML += `<div class="feedback incorrect">✗ Wrong shape! That was a ${distractor}</div>`;

                setTimeout(() => runTrial(), 800);
            };
            canvasDiv.appendChild(distShape);
        });

        trialStartTime = Date.now();
        document.getElementById('testControls').innerHTML = '';
    }

    runTrial();
}

// ===== CHOICE REACTION TEST (REMOVED - REPLACED BY TARGET VS DISTRACTORS) =====

// ===== GO/NO-GO TEST - ENHANCED =====
function runGoNoGoTest() {
    const container = document.getElementById('testContainer');
    const shapes = ['circle', 'square', 'triangle'];
    const colors = ['#7ed321', '#d0021b', '#4a90e2', '#f5a623'];
    const numTrials = 20;
    const goPercentage = 0.7;
    let currentTrial = 0;
    let trialStartTime = null;
    let stimulusActive = false;
    let responseRecorded = false;

    const goShape = 'circle';
    const goColor = '#7ed321'; // Green for GO

    function drawShape(type, color, size = 80) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', size);
        svg.setAttribute('height', size);

        let shape;
        if (type === 'circle') {
            shape = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            shape.setAttribute('cx', size / 2);
            shape.setAttribute('cy', size / 2);
            shape.setAttribute('r', size / 2 - 2);
        } else if (type === 'square') {
            shape = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            shape.setAttribute('x', '4');
            shape.setAttribute('y', '4');
            shape.setAttribute('width', size - 8);
            shape.setAttribute('height', size - 8);
        } else {
            shape = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            shape.setAttribute('points', `${size/2},4 ${size-4},${size-4} 4,${size-4}`);
        }

        shape.setAttribute('fill', color);
        shape.setAttribute('stroke', '#333');
        shape.setAttribute('stroke-width', '2');
        svg.appendChild(shape);

        return svg;
    }

    function getStimulus() {
        if (Math.random() < goPercentage) {
            return {
                type: 'GO',
                shape: goShape,
                color: goColor,
                isGo: true
            };
        } else {
            const randomShape = shapes[Math.floor(Math.random() * shapes.length)];
            const randomColor = colors.filter(c => c !== goColor)[Math.floor(Math.random() * 3)];
            return {
                type: 'NO-GO',
                shape: randomShape,
                color: randomColor,
                isGo: false
            };
        }
    }

    function runTrial() {
        if (currentTrial >= numTrials) {
            endTest();
            return;
        }

        currentTrial++;
        AppState.testData.totalTrials++;
        updateProgress(currentTrial, numTrials);

        const stimulus = getStimulus();
        stimulusActive = true;
        responseRecorded = false;
        trialStartTime = Date.now();

        container.innerHTML = `
            <p style="font-size: 0.95rem; color: #999; margin-bottom: 1.5rem;">
                <strong>GO:</strong> Green Circle | <strong>NO-GO:</strong> Any other shape/color
            </p>
            <div style="display: flex; justify-content: center; margin: 2rem 0;">
            </div>
        `;

        const shapeDiv = container.querySelector('div');
        const svgShape = drawShape(stimulus.shape, stimulus.color, 100);
        shapeDiv.appendChild(svgShape);

        document.getElementById('testControls').innerHTML = '';

        if (stimulus.isGo) {
            const reactionButton = document.createElement('button');
            reactionButton.className = 'reaction-button';
            reactionButton.textContent = 'CLICK!';

            reactionButton.onclick = () => {
                if (!stimulusActive || responseRecorded) return;
                responseRecorded = true;
                stimulusActive = false;

                const reactionTime = Date.now() - trialStartTime;
                AppState.testData.reactionTimes.push(reactionTime);
                AppState.testData.correctResponses++;
                AppState.testData.score++;

                reactionButton.disabled = true;
                container.innerHTML += `<div class="feedback correct">✓ Hit! ${reactionTime}ms</div>`;

                setTimeout(() => runTrial(), 800);
            };

            document.getElementById('testControls').appendChild(reactionButton);

            setTimeout(() => {
                if (!responseRecorded && stimulusActive) {
                    stimulusActive = false;
                    responseRecorded = true;
                    AppState.testData.errors++;
                    container.innerHTML += `<div class="feedback incorrect">✗ Omission Error - Missed Go signal!</div>`;
                    setTimeout(() => runTrial(), 800);
                }
            }, 1000);
        } else {
            const reactionButton = document.createElement('button');
            reactionButton.className = 'reaction-button';
            reactionButton.textContent = 'CLICK';
            reactionButton.style.opacity = '0.3';

            reactionButton.onclick = () => {
                if (!stimulusActive || responseRecorded) return;
                responseRecorded = true;
                stimulusActive = false;

                AppState.testData.errors++;
                reactionButton.disabled = true;
                container.innerHTML += `<div class="feedback incorrect">✗ Commission Error - False Alarm!</div>`;

                setTimeout(() => runTrial(), 800);
            };

            document.getElementById('testControls').appendChild(reactionButton);

            setTimeout(() => {
                if (!responseRecorded && stimulusActive) {
                    stimulusActive = false;
                    responseRecorded = true;
                    AppState.testData.correctResponses++;
                    AppState.testData.score++;
                    container.innerHTML += `<div class="feedback correct">✓ Correct Rejection!</div>`;
                    setTimeout(() => runTrial(), 800);
                }
            }, 1000);
        }
    }

    runTrial();
}

// ===== STROOP-LIKE REACTION TEST =====
function runStroopReactionTest() {
    const container = document.getElementById('testContainer');
    const colors = ['Red', 'Blue', 'Green', 'Yellow'];
    const colorMap = {
        'Red': '#d0021b',
        'Blue': '#4a90e2',
        'Green': '#7ed321',
        'Yellow': '#f5a623'
    };
    const numTrials = 15;
    let currentTrial = 0;
    let trialStartTime = null;

    function getRandomPosition() {
        return {
            x: Math.random() * 70 + 15,
            y: Math.random() * 40 + 30
        };
    }

    function runTrial() {
        if (currentTrial >= numTrials) {
            endTest();
            return;
        }

        currentTrial++;
        AppState.testData.totalTrials++;
        updateProgress(currentTrial, numTrials);

        let wordColor = colors[Math.floor(Math.random() * colors.length)];
        let inkColor = colors[Math.floor(Math.random() * colors.length)];

        while (inkColor === wordColor) {
            inkColor = colors[Math.floor(Math.random() * colors.length)];
        }

        const position = getRandomPosition();
        const displayColors = [...colors].sort(() => Math.random() - 0.5);

        container.innerHTML = `
            <div style="position: relative; width: 100%; height: 200px; margin-bottom: 2rem;">
                <div style="position: absolute; left: ${position.x}%; top: ${position.y}%; font-size: 2.5rem; font-weight: bold; color: ${colorMap[inkColor]};">
                    ${wordColor.toUpperCase()}
                </div>
            </div>
            <p style="font-size: 0.95rem; color: #999;">Click the color of the INK (not the word)</p>
        `;

        const controlsContainer = document.getElementById('testControls');
        controlsContainer.innerHTML = '';
        controlsContainer.className = 'choice-buttons';

        trialStartTime = Date.now();

        displayColors.forEach(color => {
            const btn = document.createElement('button');
            btn.className = 'choice-button';
            btn.textContent = color;
            btn.style.backgroundColor = colorMap[color];
            btn.style.color = 'white';

            btn.onclick = () => {
                const reactionTime = Date.now() - trialStartTime;
                const isCorrect = color === inkColor;

                if (isCorrect) {
                    AppState.testData.correctResponses++;
                    AppState.testData.score++;
                    AppState.testData.reactionTimes.push(reactionTime);
                } else {
                    AppState.testData.errors++;
                }

                displayColors.forEach(c => {
                    const btns = document.querySelectorAll('.choice-button');
                    btns.forEach(b => b.disabled = true);
                });

                const feedbackClass = isCorrect ? 'correct' : 'incorrect';
                const feedbackText = isCorrect ? `✓ Correct! ${reactionTime}ms` : '✗ Incorrect!';
                container.innerHTML += `<div class="feedback ${feedbackClass}">${feedbackText}</div>`;

                setTimeout(() => runTrial(), 800);
            };

            controlsContainer.appendChild(btn);
        });
    }

    runTrial();
}

// ===== TARGET VS DISTRACTORS TEST =====
function runTargetDistractorsTest() {
    const container = document.getElementById('testContainer');
    const shapes = ['circle', 'square', 'triangle'];
    const colors = [
        { hex: '#FF0000', name: 'red' },
        { hex: '#FFFF00', name: 'yellow' },
        { hex: '#0000FF', name: 'blue' },
        { hex: '#FF69B4', name: 'pink' },
        { hex: '#FFA500', name: 'orange' },
        { hex: '#00FF00', name: 'green' },
        { hex: '#800080', name: 'purple' }
    ];
    const numTrials = 12;
    let currentTrial = 0;
    let trialStartTime = null;

    function drawShape(type, colorObj, size = 50) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', size);
        svg.setAttribute('height', size);
        svg.style.cursor = 'pointer';

        let shape;
        if (type === 'circle') {
            shape = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            shape.setAttribute('cx', size / 2);
            shape.setAttribute('cy', size / 2);
            shape.setAttribute('r', size / 2 - 2);
        } else if (type === 'square') {
            shape = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            shape.setAttribute('x', '3');
            shape.setAttribute('y', '3');
            shape.setAttribute('width', size - 6);
            shape.setAttribute('height', size - 6);
        } else {
            shape = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            shape.setAttribute('points', `${size/2},3 ${size-3},${size-3} 3,${size-3}`);
        }

        shape.setAttribute('fill', colorObj.hex);
        shape.setAttribute('stroke', '#333');
        shape.setAttribute('stroke-width', '2');
        svg.appendChild(shape);

        return svg;
    }

    function runTrial() {
        if (currentTrial >= numTrials) {
            endTest();
            return;
        }

        currentTrial++;
        AppState.testData.totalTrials++;
        updateProgress(currentTrial, numTrials);

        const targetShape = shapes[Math.floor(Math.random() * shapes.length)];
        const targetColorObj = colors[Math.floor(Math.random() * colors.length)];
        
        // Number of distractors increases with trial number
        const numDistractors = Math.floor(3 + (currentTrial / numTrials) * 4);

        container.innerHTML = `
            <p style="font-size: 1rem; color: #999; margin-bottom: 1.5rem;">
                Find and click the <strong>${targetColorObj.name.toUpperCase()}</strong> 
                <strong>${targetShape.toUpperCase()}</strong>
            </p>
            <div style="position: relative; width: 100%; height: 300px; background: #f5f5f5; border-radius: 8px; margin: 1rem 0;"></div>
        `;

        const canvasDiv = container.querySelector('div');
        canvasDiv.style.position = 'relative';

        let targetFound = false;

        // Add target
        const targetPos = {
            x: Math.random() * 80 + 10,
            y: Math.random() * 80 + 10
        };

        const targetSvg = drawShape(targetShape, targetColorObj, 60);
        targetSvg.style.position = 'absolute';
        targetSvg.style.left = targetPos.x + '%';
        targetSvg.style.top = targetPos.y + '%';
        targetSvg.style.transform = 'translate(-50%, -50%)';

        trialStartTime = Date.now();

        targetSvg.onclick = (e) => {
            e.stopPropagation();
            if (targetFound) return;
            targetFound = true;

            const reactionTime = Date.now() - trialStartTime;
            AppState.testData.reactionTimes.push(reactionTime);
            AppState.testData.correctResponses++;
            AppState.testData.score++;

            container.innerHTML += `<div class="feedback correct">✓ Found it! ${reactionTime}ms</div>`;
            setTimeout(() => runTrial(), 800);
        };

        canvasDiv.appendChild(targetSvg);

        // Add distractors
        for (let i = 0; i < numDistractors; i++) {
            const distShape = shapes[Math.floor(Math.random() * shapes.length)];
            const distColorObj = colors[Math.floor(Math.random() * colors.length)];

            const distPos = {
                x: Math.random() * 80 + 10,
                y: Math.random() * 80 + 10
            };

            const distSvg = drawShape(distShape, distColorObj, 50);
            distSvg.style.position = 'absolute';
            distSvg.style.left = distPos.x + '%';
            distSvg.style.top = distPos.y + '%';
            distSvg.style.transform = 'translate(-50%, -50%)';

            distSvg.onclick = (e) => {
                e.stopPropagation();
                if (targetFound) return;

                AppState.testData.errors++;
                container.innerHTML += `<div class="feedback incorrect">✗ Wrong shape/color!</div>`;
                setTimeout(() => runTrial(), 800);
            };

            canvasDiv.appendChild(distSvg);
        }

        document.getElementById('testControls').innerHTML = '';
    }

    runTrial();
}

// ===== N-BACK TEST =====
function runNBackTest() {
    const container = document.getElementById('testContainer');
    const shapes = ['circle', 'square', 'triangle'];
    const numTrials = 20;
    let currentTrial = 0;
    let shapeSequence = [];

    function drawShape(type, color, size = 60) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', size);
        svg.setAttribute('height', size);

        let shape;
        if (type === 'circle') {
            shape = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            shape.setAttribute('cx', size / 2);
            shape.setAttribute('cy', size / 2);
            shape.setAttribute('r', size / 2 - 2);
        } else if (type === 'square') {
            shape = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            shape.setAttribute('x', '3');
            shape.setAttribute('y', '3');
            shape.setAttribute('width', size - 6);
            shape.setAttribute('height', size - 6);
        } else {
            shape = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            shape.setAttribute('points', `${size/2},3 ${size-3},${size-3} 3,${size-3}`);
        }

        shape.setAttribute('fill', color);
        shape.setAttribute('stroke', '#333');
        shape.setAttribute('stroke-width', '2');
        svg.appendChild(shape);

        return svg;
    }

    function runTrial() {
        if (currentTrial >= numTrials) {
            endTest();
            return;
        }

        currentTrial++;
        AppState.testData.totalTrials++;
        updateProgress(currentTrial, numTrials);

        const currentShape = shapes[Math.floor(Math.random() * shapes.length)];
        shapeSequence.push(currentShape);

        // Check if matches 1-back or 2-back (only matters from trial 3 onwards)
        const match1Back = currentTrial > 1 && shapeSequence[currentTrial - 2] === currentShape;
        const match2Back = currentTrial > 2 && shapeSequence[currentTrial - 3] === currentShape;
        
        // Determine if we should match based on trial number
        let shouldMatch = false;
        let matchInfo = '';
        
        if (currentTrial === 2) {
            // Trial 2: Check only 1-back
            shouldMatch = match1Back;
            matchInfo = '(matches 1 back)';
        } else if (currentTrial > 2) {
            // Trial 3+: Check both 1-back and 2-back
            shouldMatch = match1Back || match2Back;
            if (match1Back && match2Back) {
                matchInfo = '(matches 1 and 2 back)';
            } else if (match1Back) {
                matchInfo = '(matches 1 back)';
            } else if (match2Back) {
                matchInfo = '(matches 2 back)';
            }
        }

        container.innerHTML = `
            <p style="font-size: 0.95rem; color: #999; margin-bottom: 1.5rem;">
                ${currentTrial === 1 ? 'Learning the sequence...' : 'Click if current shape matches 1 back'}
            </p>
            <div style="display: flex; justify-content: center; margin: 2rem 0;">
            </div>
        `;

        const shapeDiv = container.querySelector('div');
        const svg = drawShape(currentShape, '#4a90e2');
        shapeDiv.appendChild(svg);

        // For first trial, just show and advance without asking for response
        if (currentTrial === 1) {
            document.getElementById('testControls').innerHTML = '';
            setTimeout(() => runTrial(), 1500);
            return;
        }

        const startTime = Date.now();
        let responded = false;

        const matchButton = document.createElement('button');
        matchButton.className = 'reaction-button';
        matchButton.textContent = 'MATCH';

        const noMatchButton = document.createElement('button');
        noMatchButton.className = 'reaction-button';
        noMatchButton.style.marginLeft = '1rem';
        noMatchButton.style.backgroundColor = '#f5a623';
        noMatchButton.textContent = 'NO MATCH';

        matchButton.onclick = () => {
            if (responded) return;
            responded = true;
            const reactionTime = Date.now() - startTime;

            if (shouldMatch) {
                AppState.testData.correctResponses++;
                AppState.testData.score++;
                AppState.testData.reactionTimes.push(reactionTime);
                container.innerHTML += `<div class="feedback correct">✓ Correct! ${reactionTime}ms</div>`;
            } else {
                AppState.testData.errors++;
                container.innerHTML += `<div class="feedback incorrect">✗ Incorrect! No match</div>`;
            }

            matchButton.disabled = true;
            noMatchButton.disabled = true;
            setTimeout(() => runTrial(), 1000);
        };

        noMatchButton.onclick = () => {
            if (responded) return;
            responded = true;
            const reactionTime = Date.now() - startTime;

            if (!shouldMatch) {
                AppState.testData.correctResponses++;
                AppState.testData.score++;
                AppState.testData.reactionTimes.push(reactionTime);
                container.innerHTML += `<div class="feedback correct">✓ Correct! ${reactionTime}ms</div>`;
            } else {
                AppState.testData.errors++;
                container.innerHTML += `<div class="feedback incorrect">✗ Incorrect! It matches</div>`;
            }

            matchButton.disabled = true;
            noMatchButton.disabled = true;
            setTimeout(() => runTrial(), 1000);
        };

        document.getElementById('testControls').innerHTML = '';
        document.getElementById('testControls').appendChild(matchButton);
        document.getElementById('testControls').appendChild(noMatchButton);

        // Auto-advance if no response after 3 seconds
        setTimeout(() => {
            if (!responded) {
                responded = true;
                AppState.testData.errors++;
                container.innerHTML += `<div class="feedback incorrect">✗ No response</div>`;
                matchButton.disabled = true;
                noMatchButton.disabled = true;
                setTimeout(() => runTrial(), 800);
            }
        }, 3000);
    }

    runTrial();
}

// ===== SEQUENCE MEMORY TEST =====
function runSequenceMemoryTest() {
    const container = document.getElementById('testContainer');
    const shapes = ['circle', 'square', 'triangle'];
    const colors = ['#FF0000', '#0000FF', '#FFFF00'];
    const numSequences = 5;
    let currentSequence = 0;

    function drawShape(type, color, size = 50) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', size);
        svg.setAttribute('height', size);

        let shape;
        if (type === 'circle') {
            shape = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            shape.setAttribute('cx', size / 2);
            shape.setAttribute('cy', size / 2);
            shape.setAttribute('r', size / 2 - 2);
        } else if (type === 'square') {
            shape = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            shape.setAttribute('x', '3');
            shape.setAttribute('y', '3');
            shape.setAttribute('width', size - 6);
            shape.setAttribute('height', size - 6);
        } else {
            shape = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            shape.setAttribute('points', `${size/2},3 ${size-3},${size-3} 3,${size-3}`);
        }

        shape.setAttribute('fill', color);
        shape.setAttribute('stroke', '#333');
        shape.setAttribute('stroke-width', '2');
        svg.appendChild(shape);

        return svg;
    }

    function runSequence() {
        if (currentSequence >= numSequences) {
            endTest();
            return;
        }

        currentSequence++;
        AppState.testData.totalTrials++;
        updateProgress(currentSequence, numSequences);

        // Generate random sequence (4-6 items)
        const seqLength = 4 + Math.floor(Math.random() * 3);
        const sequence = [];

        for (let i = 0; i < seqLength; i++) {
            sequence.push({
                shape: shapes[Math.floor(Math.random() * shapes.length)],
                color: colors[Math.floor(Math.random() * colors.length)]
            });
        }

        container.innerHTML = '<p style="color: #999; margin-bottom: 1rem;">Watch the sequence...</p>';
        document.getElementById('testControls').innerHTML = '';

        // Show sequence
        let index = 0;
        const showNext = () => {
            if (index >= sequence.length) {
                // Sequence complete, ask for reproduction
                askForReproduction(sequence);
                return;
            }

            const item = sequence[index];
            container.innerHTML = '<p style="color: #999; margin-bottom: 1rem;">Watch the sequence...</p>';
            
            const shapeDiv = document.createElement('div');
            shapeDiv.style.display = 'flex';
            shapeDiv.style.justifyContent = 'center';
            shapeDiv.style.margin = '2rem 0';
            
            const svg = drawShape(item.shape, item.color, 100);
            shapeDiv.appendChild(svg);
            container.appendChild(shapeDiv);

            index++;
            setTimeout(showNext, 1000);
        };

        showNext();
    }

    function askForReproduction(sequence) {
        container.innerHTML = '<p style="color: #999; margin-bottom: 1.5rem;">Click the shapes in the same order they appeared</p>';

        const controlsContainer = document.getElementById('testControls');
        controlsContainer.innerHTML = '';
        controlsContainer.style.display = 'grid';
        controlsContainer.style.gridTemplateColumns = 'repeat(3, 80px)';
        controlsContainer.style.justifyContent = 'center';
        controlsContainer.style.gap = '1rem';

        let userSequence = [];
        let correct = true;
        const userHistory = [];

        sequence.forEach((item, index) => {
            const btn = document.createElement('button');
            btn.innerHTML = '';
            
            const svg = drawShape(item.shape, item.color, 60);
            btn.appendChild(svg);
            
            btn.style.width = '80px';
            btn.style.height = '80px';
            btn.style.backgroundColor = '#f0f0f0';
            btn.style.border = '2px solid #ddd';
            btn.style.borderRadius = '8px';
            btn.style.cursor = 'pointer';
            btn.style.padding = '0';
            btn.style.display = 'flex';
            btn.style.alignItems = 'center';
            btn.style.justifyContent = 'center';

            btn.onmouseover = () => {
                if (correct) btn.style.backgroundColor = '#e0e0e0';
            };
            btn.onmouseout = () => {
                if (correct) btn.style.backgroundColor = '#f0f0f0';
            };

            btn.onclick = () => {
                if (!correct) return;

                userSequence.push(index);
                userHistory.push(item);

                // Check if correct so far
                if (userSequence[userSequence.length - 1] === userSequence.length - 1) {
                    // Correct so far - highlight this button as selected
                    btn.style.borderColor = '#4a90e2';
                    btn.style.borderWidth = '3px';

                    if (userSequence.length === sequence.length) {
                        // Full sequence matched!
                        AppState.testData.correctResponses++;
                        AppState.testData.score++;
                        container.innerHTML = `<div class="feedback correct">✓ Perfect! All ${sequence.length} items matched</div>`;

                        setTimeout(() => runSequence(), 1500);
                    }
                } else {
                    // Wrong sequence
                    correct = false;
                    AppState.testData.errors++;
                    container.innerHTML = `<div class="feedback incorrect">✗ Wrong order! You matched ${userSequence.length}/${sequence.length} items</div>`;

                    setTimeout(() => runSequence(), 1500);
                }
            };

            controlsContainer.appendChild(btn);
        });
    }

    runSequence();
}

// ===== SPATIAL MEMORY TEST =====
function runSpatialMemoryTest() {
    const container = document.getElementById('testContainer');
    const gridSize = 3; // 3x3 grid
    const numSequences = 5;
    let currentSequence = 0;

    function runSequence() {
        if (currentSequence >= numSequences) {
            endTest();
            return;
        }

        currentSequence++;
        AppState.testData.totalTrials++;
        updateProgress(currentSequence, numSequences);

        // Generate random sequence (4-6 positions)
        const seqLength = 4 + Math.floor(Math.random() * 3);
        const sequence = [];

        for (let i = 0; i < seqLength; i++) {
            sequence.push({
                row: Math.floor(Math.random() * gridSize),
                col: Math.floor(Math.random() * gridSize)
            });
        }

        container.innerHTML = '<p style="color: #999; margin-bottom: 1.5rem;">Watch which grid positions light up...</p>';
        
        const gridDiv = document.createElement('div');
        gridDiv.style.display = 'grid';
        gridDiv.style.gridTemplateColumns = `repeat(${gridSize}, 60px)`;
        gridDiv.style.gap = '10px';
        gridDiv.style.justifyContent = 'center';
        gridDiv.style.margin = '2rem 0';

        const cells = [];
        for (let i = 0; i < gridSize * gridSize; i++) {
            const cell = document.createElement('div');
            cell.style.width = '60px';
            cell.style.height = '60px';
            cell.style.backgroundColor = '#ddd';
            cell.style.borderRadius = '8px';
            cell.style.cursor = 'pointer';
            cell.dataset.index = i;
            cells.push(cell);
            gridDiv.appendChild(cell);
        }

        container.appendChild(gridDiv);
        document.getElementById('testControls').innerHTML = '';

        // Flash sequence
        let index = 0;
        const flashNext = () => {
            if (index >= sequence.length) {
                // Sequence complete, ask for reproduction
                setTimeout(() => askForReproduction(gridSize, sequence, cells), 1000);
                return;
            }

            const pos = sequence[index];
            const cellIndex = pos.row * gridSize + pos.col;
            const cell = cells[cellIndex];

            cell.style.backgroundColor = '#4a90e2';
            index++;

            setTimeout(() => {
                cell.style.backgroundColor = '#ddd';
                setTimeout(flashNext, 500);
            }, 500);
        };

        flashNext();
    }

    function askForReproduction(gridSize, sequence, cells) {
        container.querySelector('p').textContent = 'Click grid positions in the same order';

        let userSequence = [];
        let correct = true;

        cells.forEach((cell, index) => {
            cell.style.cursor = 'pointer';
            cell.onclick = () => {
                if (!correct) return;

                const row = Math.floor(index / gridSize);
                const col = index % gridSize;

                userSequence.push({ row, col });
                cell.style.backgroundColor = '#7ed321';

                // Check if correct so far
                const expectedIndex = userSequence.length - 1;
                if (sequence[expectedIndex].row === row && sequence[expectedIndex].col === col) {
                    if (userSequence.length === sequence.length) {
                        // Perfect!
                        correct = false;
                        AppState.testData.correctResponses++;
                        AppState.testData.score++;
                        container.innerHTML += `<div class="feedback correct">✓ Perfect! All ${sequence.length} positions matched</div>`;

                        setTimeout(() => runSequence(), 1500);
                    }
                } else {
                    // Wrong
                    correct = false;
                    AppState.testData.errors++;
                    container.innerHTML += `<div class="feedback incorrect">✗ Wrong position! You matched ${userSequence.length} positions</div>`;

                    setTimeout(() => runSequence(), 1500);
                }
            };
        });
    }

    runSequence();
}

// ===== SIMPLE DECISION-MAKING TEST =====
function runDecisionMakingTest() {
    const container = document.getElementById('testContainer');
    const numTrials = 15;
    let currentTrial = 0;
    let trialStartTime = null;

    const questions = [
        { q: 'Which shape has 4 equal sides?', opts: ['Circle', 'Square', 'Triangle'], correct: 1 },
        { q: 'What color is the sky?', opts: ['Red', 'Blue', 'Green'], correct: 1 },
        { q: 'How many sides does a triangle have?', opts: ['3', '4', '5'], correct: 0 },
        { q: 'Which is a primary color?', opts: ['Orange', 'Red', 'Purple'], correct: 1 },
        { q: 'What is 5 + 3?', opts: ['7', '8', '9'], correct: 1 },
        { q: '2 × 4 = ?', opts: ['6', '8', '10'], correct: 1 },
        { q: 'Which is the largest?', opts: ['50', '100', '75'], correct: 1 },
        { q: 'Is a square a rectangle?', opts: ['No', 'Yes', 'Maybe'], correct: 1 },
        { q: 'How many sides does a pentagon have?', opts: ['4', '5', '6'], correct: 1 },
        { q: 'Which color is NOT a primary color?', opts: ['Red', 'Green', 'Blue'], correct: 1 },
        { q: 'What is the opposite of hot?', opts: ['Warm', 'Cold', 'Cool'], correct: 1 },
        { q: 'How many legs does a spider have?', opts: ['6', '8', '10'], correct: 1 },
        { q: 'Is ice solid or liquid?', opts: ['Liquid', 'Solid', 'Gas'], correct: 1 },
        { q: 'Which is fastest?', opts: ['Car', 'Airplane', 'Bicycle'], correct: 1 },
        { q: 'Is the Earth flat?', opts: ['Yes', 'No', 'Unknown'], correct: 1 }
    ];

    function runTrial() {
        if (currentTrial >= numTrials) {
            endTest();
            return;
        }

        currentTrial++;
        AppState.testData.totalTrials++;
        updateProgress(currentTrial, numTrials);

        const question = questions[currentTrial - 1];
        const shuffled = [...question.opts].sort(() => Math.random() - 0.5);
        const correctAnswer = shuffled.indexOf(question.opts[question.correct]);

        container.innerHTML = `<p style="font-size: 1.2rem; font-weight: bold; margin-bottom: 2rem;">${question.q}</p>`;

        const controlsContainer = document.getElementById('testControls');
        controlsContainer.innerHTML = '';
        controlsContainer.className = 'choice-buttons';

        trialStartTime = Date.now();

        shuffled.forEach((option, index) => {
            const btn = document.createElement('button');
            btn.className = 'choice-button';
            btn.textContent = option;
            btn.style.backgroundColor = '#4a90e2';

            btn.onclick = () => {
                const reactionTime = Date.now() - trialStartTime;
                const isCorrect = index === correctAnswer;

                if (isCorrect) {
                    AppState.testData.correctResponses++;
                    AppState.testData.score++;
                    AppState.testData.reactionTimes.push(reactionTime);
                    btn.style.backgroundColor = '#7ed321';
                } else {
                    AppState.testData.errors++;
                    btn.style.backgroundColor = '#d0021b';
                }

                shuffled.forEach((_, i) => {
                    const btns = document.querySelectorAll('.choice-button');
                    if (i !== index) btns[i].disabled = true;
                });

                const feedbackClass = isCorrect ? 'correct' : 'incorrect';
                const feedbackText = isCorrect ? `✓ Correct! ${reactionTime}ms` : '✗ Incorrect!';
                container.innerHTML += `<div class="feedback ${feedbackClass}">${feedbackText}</div>`;

                setTimeout(() => runTrial(), 1000);
            };

            controlsContainer.appendChild(btn);
        });

        // 8 second time limit
        setTimeout(() => {
            const btns = document.querySelectorAll('.choice-button');
            if (btns.length > 0 && !btns[0].disabled) {
                AppState.testData.errors++;
                container.innerHTML += `<div class="feedback incorrect">✗ Time's up!</div>`;
                btns.forEach(b => b.disabled = true);
                setTimeout(() => runTrial(), 1000);
            }
        }, 8000);
    }

    runTrial();
}

// ===== TASK SWITCHING / MENTAL FLEXIBILITY TEST =====
function runTaskSwitchingTest() {
    const container = document.getElementById('testContainer');
    const colors = ['#d0021b', '#4a90e2', '#7ed321'];
    const colorNames = ['Red', 'Blue', 'Green'];
    const shapes = ['circle', 'square', 'triangle'];
    const numTrials = 20; // 10 per rule
    let currentTrial = 0;
    let trialStartTime = null;
    let currentRule = 'color'; // Alternate between color and shape

    function drawShape(type, color, size = 80) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', size);
        svg.setAttribute('height', size);

        let shape;
        if (type === 'circle') {
            shape = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            shape.setAttribute('cx', size / 2);
            shape.setAttribute('cy', size / 2);
            shape.setAttribute('r', size / 2 - 2);
        } else if (type === 'square') {
            shape = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            shape.setAttribute('x', '5');
            shape.setAttribute('y', '5');
            shape.setAttribute('width', size - 10);
            shape.setAttribute('height', size - 10);
        } else {
            shape = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            shape.setAttribute('points', `${size/2},5 ${size-5},${size-5} 5,${size-5}`);
        }

        shape.setAttribute('fill', color);
        shape.setAttribute('stroke', '#333');
        shape.setAttribute('stroke-width', '2');
        svg.appendChild(shape);

        return svg;
    }

    function runTrial() {
        if (currentTrial >= numTrials) {
            endTest();
            return;
        }

        currentTrial++;
        AppState.testData.totalTrials++;
        updateProgress(currentTrial, numTrials);

        // Switch rule every 10 trials
        if (currentTrial === 11) {
            currentRule = currentRule === 'color' ? 'shape' : 'color';
        }

        const targetShape = shapes[Math.floor(Math.random() * shapes.length)];
        const targetColorIndex = Math.floor(Math.random() * colors.length);
        const targetColor = colors[targetColorIndex];

        const options = [];
        for (let i = 0; i < 3; i++) {
            options.push({
                shape: shapes[i],
                color: colors[i]
            });
        }

        // Shuffle options
        options.sort(() => Math.random() - 0.5);

        let correctAnswer = -1;
        if (currentRule === 'color') {
            correctAnswer = options.findIndex(opt => opt.color === targetColor);
        } else {
            correctAnswer = options.findIndex(opt => opt.shape === targetShape);
        }

        container.innerHTML = `
            <p style="font-size: 0.95rem; color: #999; margin-bottom: 1rem;">
                ${currentTrial <= 10 ? '<strong>Rule: Click the matching COLOR</strong>' : '<strong>Rule: Click the matching SHAPE</strong>'}
            </p>
            <p style="font-size: 1.1rem; font-weight: bold; margin-bottom: 1.5rem;">
                Target: <span style="color: ${targetColor};">●</span>
                ${currentTrial > 10 ? ` ${targetShape}` : ''}
            </p>
        `;

        const controlsContainer = document.getElementById('testControls');
        controlsContainer.innerHTML = '';
        controlsContainer.className = 'choice-buttons';

        trialStartTime = Date.now();

        options.forEach((opt, index) => {
            const btn = document.createElement('button');
            btn.className = 'choice-button';
            btn.style.width = '100px';
            btn.style.height = '100px';
            btn.style.display = 'flex';
            btn.style.alignItems = 'center';
            btn.style.justifyContent = 'center';
            btn.style.padding = '0';

            const svg = drawShape(opt.shape, opt.color, 60);
            btn.appendChild(svg);

            btn.onclick = () => {
                const reactionTime = Date.now() - trialStartTime;
                const isCorrect = index === correctAnswer;

                if (isCorrect) {
                    AppState.testData.correctResponses++;
                    AppState.testData.score++;
                    AppState.testData.reactionTimes.push(reactionTime);
                } else {
                    AppState.testData.errors++;
                }

                controlsContainer.querySelectorAll('button').forEach(b => b.disabled = true);

                const feedbackClass = isCorrect ? 'correct' : 'incorrect';
                const feedbackText = isCorrect ? `✓ Correct! ${reactionTime}ms` : '✗ Incorrect!';
                container.innerHTML += `<div class="feedback ${feedbackClass}">${feedbackText}</div>`;

                setTimeout(() => runTrial(), 1000);
            };

            controlsContainer.appendChild(btn);
        });
    }

    runTrial();
}

// ===== TEST HELPERS =====
function updateProgress(current, total) {
    const progressContainer = document.getElementById('testProgress');
    const percent = (current / total) * 100;
    progressContainer.innerHTML = `
        <div class="progress-bar">
            <div class="progress-fill" style="width: ${percent}%"></div>
        </div>
        <div class="progress-text">Trial ${current} of ${total}</div>
    `;
}

function endTest() {
    AppState.testData.endTime = Date.now();
    AppState.isTestRunning = false;

    saveSession();
    displayResults();
    showScreen('resultsScreen');
}

// ===== SESSION MANAGEMENT =====
function saveSession() {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0].slice(0, 5);

    const testNames = {
        'simple-reaction': 'Simple Reaction',
        'go-no-go': 'Go/No-Go',
        'stroop-reaction': 'Stroop-like Reaction',
        'target-distractors': 'Target vs Distractors',
        'n-back': 'N-Back',
        'sequence-memory': 'Sequence Memory',
        'spatial-memory': 'Spatial Memory',
        'decision-making': 'Decision-Making',
        'task-switching': 'Task Switching'
    };

    const testTypes = {
        'reaction-attention': 'Reaction & Attention',
        'working-memory': 'Working Memory',
        'executive-function': 'Executive Function'
    };

    const session = {
        date,
        time,
        testType: testTypes[AppState.currentTestType],
        subTest: testNames[AppState.selectedTest],
        score: AppState.testData.score,
        reactionTimes: AppState.testData.reactionTimes,
        errors: AppState.testData.errors,
        totalTrials: AppState.testData.totalTrials,
        correctResponses: AppState.testData.correctResponses,
        avgReactionTime: AppState.testData.reactionTimes.length > 0
            ? Math.round(AppState.testData.reactionTimes.reduce((a, b) => a + b, 0) / AppState.testData.reactionTimes.length)
            : 0,
        factors: {
            stress: AppState.factors.stress,
            fatigue: AppState.factors.fatigue,
            age: AppState.factors.age
        }
    };

    AppState.sessions.push(session);
    saveSessionsToStorage();
}

function loadSessionsFromStorage() {
    const stored = localStorage.getItem('cognitiveTestSessions');
    AppState.sessions = stored ? JSON.parse(stored) : [];
}

function saveSessionsToStorage() {
    localStorage.setItem('cognitiveTestSessions', JSON.stringify(AppState.sessions));
}

// ===== INSIGHTS & ANALYSIS =====
function generateInsights() {
    const data = AppState.testData;
    const insights = [];

    // Check for attention dip (reaction times slowing in middle)
    if (data.reactionTimes.length > 6) {
        const firstThird = data.reactionTimes.slice(0, Math.floor(data.reactionTimes.length / 3));
        const middleThird = data.reactionTimes.slice(Math.floor(data.reactionTimes.length / 3), Math.floor(2 * data.reactionTimes.length / 3));
        
        const avgFirstThird = firstThird.reduce((a, b) => a + b, 0) / firstThird.length;
        const avgMiddleThird = middleThird.reduce((a, b) => a + b, 0) / middleThird.length;
        
        const slowdownPercent = ((avgMiddleThird - avgFirstThird) / avgFirstThird * 100);
        
        if (slowdownPercent > 15) {
            insights.push({
                type: 'attention',
                message: `Attention dip detected: Your reaction time slowed by ${Math.round(slowdownPercent)}% in the middle of the test. Try maintaining focus throughout.`
            });
        }
    }

    // Check factor impact on accuracy
    if (AppState.factors.stress !== null || AppState.factors.fatigue !== null) {
        const accuracy = (data.correctResponses / data.totalTrials) * 100;
        let factorImpact = [];

        if (AppState.factors.stress > 70) {
            factorImpact.push('high stress');
        }
        if (AppState.factors.fatigue > 70) {
            factorImpact.push('high fatigue');
        }

        if (factorImpact.length > 0 && accuracy < 75) {
            insights.push({
                type: 'factors',
                message: `Factor Impact: Your ${factorImpact.join(' and ')} may have affected your performance. Consider retesting when more relaxed and rested.`
            });
        } else if (factorImpact.length > 0 && accuracy >= 75) {
            insights.push({
                type: 'factors',
                message: `Resilience: Despite ${factorImpact.join(' and ')}, you maintained good performance! Great mental resilience.`
            });
        }
    }

    // Track learning effect across sessions
    const pastSessions = AppState.sessions.filter(s => s.subTest === AppState.sessions[AppState.sessions.length - 1].subTest);
    if (pastSessions.length > 1) {
        const previousScore = pastSessions[pastSessions.length - 2].score;
        const currentScore = data.score;
        
        if (currentScore > previousScore) {
            insights.push({
                type: 'learning',
                message: `Learning Effect: You improved by ${currentScore - previousScore} point(s) compared to your last session! Keep practicing.`
            });
        } else if (currentScore < previousScore && currentScore > 0) {
            insights.push({
                type: 'learning',
                message: `Performance Variation: Your score decreased slightly. Don't worry - performance varies. Try again when fresh.`
            });
        }
    }

    // Feedback on accuracy
    const accuracy = (data.correctResponses / data.totalTrials) * 100;
    if (accuracy >= 90) {
        insights.push({
            type: 'performance',
            message: `Excellent accuracy! You're performing at a high level. Consider trying a more challenging test.`
        });
    } else if (accuracy >= 75) {
        insights.push({
            type: 'performance',
            message: `Good performance! Your accuracy is solid. Keep practicing to improve further.`
        });
    } else if (accuracy >= 60) {
        insights.push({
            type: 'performance',
            message: `Room for improvement. Try taking the test again when you're more focused.`
        });
    }

    return insights;
}

// ===== RESULTS DISPLAY =====
function displayResults() {
    const data = AppState.testData;
    const avgReactionTime = data.reactionTimes.length > 0
        ? Math.round(data.reactionTimes.reduce((a, b) => a + b, 0) / data.reactionTimes.length)
        : 0;

    const accuracy = ((data.correctResponses / data.totalTrials) * 100).toFixed(1);
    const insights = generateInsights();

    let resultsHTML = '<div class="results-grid">';

    resultsHTML += `
        <div class="result-card success">
            <div class="result-label">Score</div>
            <div class="result-value">${data.score}/${data.totalTrials}</div>
        </div>
    `;

    if (data.reactionTimes.length > 0) {
        resultsHTML += `
            <div class="result-card">
                <div class="result-label">Avg Reaction Time</div>
                <div class="result-value">${avgReactionTime}ms</div>
            </div>
        `;
    }

    resultsHTML += `
        <div class="result-card ${data.errors > 0 ? 'warning' : 'success'}">
            <div class="result-label">Errors</div>
            <div class="result-value">${data.errors}</div>
        </div>
    `;

    resultsHTML += `
        <div class="result-card">
            <div class="result-label">Accuracy</div>
            <div class="result-value">${accuracy}%</div>
        </div>
    `;

    resultsHTML += '</div>';

    resultsHTML += `
        <div class="results-summary">
            <h4>Summary</h4>
            <p>You completed ${data.totalTrials} trials with ${data.correctResponses} correct responses.</p>
            ${data.reactionTimes.length > 0 ? `<p>Your average reaction time was ${avgReactionTime}ms.</p>` : ''}
            ${data.errors > 0 ? `<p>You made ${data.errors} error(s) during this test.</p>` : '<p>Excellent focus - no errors!</p>'}
        </div>
    `;

    // Show insights and observations
    if (insights.length > 0) {
        resultsHTML += '<div class="insights-section"><h4>Insights & Observations</h4>';
        insights.forEach(insight => {
            resultsHTML += `<div class="insight-item insight-${insight.type}">${insight.message}</div>`;
        });
        resultsHTML += '</div>';
    }

    // Show factors if any were entered
    if (AppState.factors.stress !== null || AppState.factors.fatigue !== null || AppState.factors.age !== null) {
        resultsHTML += `
            <div class="results-details">
                <h4>Recorded Factors</h4>
        `;

        if (AppState.factors.stress !== null) {
            let stressLabel = 'Low';
            if (AppState.factors.stress > 30 && AppState.factors.stress <= 70) stressLabel = 'Medium';
            if (AppState.factors.stress > 70) stressLabel = 'High';
            resultsHTML += `<div class="details-row"><span class="details-label">Stress Level:</span><span class="details-value">${AppState.factors.stress}% (${stressLabel})</span></div>`;
        }

        if (AppState.factors.fatigue !== null) {
            let fatigueLabel = 'Well-rested';
            if (AppState.factors.fatigue > 30 && AppState.factors.fatigue <= 70) fatigueLabel = 'Tired';
            if (AppState.factors.fatigue > 70) fatigueLabel = 'Very Tired';
            resultsHTML += `<div class="details-row"><span class="details-label">Fatigue Level:</span><span class="details-value">${AppState.factors.fatigue}% (${fatigueLabel})</span></div>`;
        }

        if (AppState.factors.age !== null) {
            resultsHTML += `<div class="details-row"><span class="details-label">Age:</span><span class="details-value">${AppState.factors.age} years</span></div>`;
        }

        resultsHTML += '</div>';
    }

    document.getElementById('resultsContent').innerHTML = resultsHTML;
}

function showResults() {
    showScreen('resultsScreen');
}

function backToTestSelection() {
    showTestSelection(AppState.currentTestType);
}

function showTrends() {
    updateTrendChart();
    showScreen('trendsScreen');
}

// ===== TRENDS VISUALIZATION & FACTOR ANALYSIS =====
function updateTrendChart() {
    const testFilter = document.getElementById('testTypeFilter').value;
    const groupByFactor = document.getElementById('groupByFactor').value;

    let filteredSessions = AppState.sessions.filter(session => {
        if (testFilter && session.subTest !== testFilter) return false;
        return true;
    });

    const trendsChart = document.getElementById('trendsChart');
    const factorAnalysis = document.getElementById('factorAnalysis');

    if (filteredSessions.length === 0) {
        trendsChart.innerHTML = '<div class="no-data">No data available for the selected filters</div>';
        factorAnalysis.innerHTML = '';
        return;
    }

    // Group sessions by factor if requested
    let groupedData = { 'All Sessions': filteredSessions };
    
    if (groupByFactor === 'stress') {
        groupedData = groupSessionsByStress(filteredSessions);
    } else if (groupByFactor === 'fatigue') {
        groupedData = groupSessionsByFatigue(filteredSessions);
    } else if (groupByFactor === 'stress-fatigue') {
        groupedData = groupSessionsByStressAndFatigue(filteredSessions);
    }

    // Generate chart and analysis
    generateFactorChart(groupedData, groupByFactor);
    generateFactorAnalysis(groupedData, groupByFactor);
}

function groupSessionsByStress(sessions) {
    const groups = {
        'Low Stress (0-30%)': [],
        'Medium Stress (31-70%)': [],
        'High Stress (71-100%)': []
    };

    sessions.forEach(s => {
        if (s.factors.stress === null) {
            groups['No Data'] = groups['No Data'] || [];
            groups['No Data'].push(s);
        } else if (s.factors.stress <= 30) {
            groups['Low Stress (0-30%)'].push(s);
        } else if (s.factors.stress <= 70) {
            groups['Medium Stress (31-70%)'].push(s);
        } else {
            groups['High Stress (71-100%)'].push(s);
        }
    });

    return Object.fromEntries(Object.entries(groups).filter(([, v]) => v.length > 0));
}

function groupSessionsByFatigue(sessions) {
    const groups = {
        'Well-rested (0-30%)': [],
        'Tired (31-70%)': [],
        'Very Tired (71-100%)': []
    };

    sessions.forEach(s => {
        if (s.factors.fatigue === null) {
            groups['No Data'] = groups['No Data'] || [];
            groups['No Data'].push(s);
        } else if (s.factors.fatigue <= 30) {
            groups['Well-rested (0-30%)'].push(s);
        } else if (s.factors.fatigue <= 70) {
            groups['Tired (31-70%)'].push(s);
        } else {
            groups['Very Tired (71-100%)'].push(s);
        }
    });

    return Object.fromEntries(Object.entries(groups).filter(([, v]) => v.length > 0));
}

function groupSessionsByStressAndFatigue(sessions) {
    const groups = {};

    sessions.forEach(s => {
        if (s.factors.stress === null || s.factors.fatigue === null) {
            const key = 'Incomplete Data';
            groups[key] = groups[key] || [];
            groups[key].push(s);
        } else {
            let stressLabel = s.factors.stress <= 30 ? 'Low' : s.factors.stress <= 70 ? 'Med' : 'High';
            let fatigueLabel = s.factors.fatigue <= 30 ? 'Rested' : s.factors.fatigue <= 70 ? 'Tired' : 'V.Tired';
            const key = `Stress:${stressLabel} + Fatigue:${fatigueLabel}`;
            groups[key] = groups[key] || [];
            groups[key].push(s);
        }
    });

    return groups;
}

function generateFactorChart(groupedData, groupByFactor) {
    const trendsChart = document.getElementById('trendsChart');
    let chartHTML = '<div class="factor-chart">';

    const maxAvgRT = Math.max(...Object.values(groupedData).flat().map(s => s.avgReactionTime || 0), 1);

    Object.entries(groupedData).forEach(([groupName, sessions]) => {
        if (sessions.length === 0) return;

        const avgRT = Math.round(sessions.reduce((sum, s) => sum + (s.avgReactionTime || 0), 0) / sessions.length);
        const totalErrors = sessions.reduce((sum, s) => sum + s.errors, 0);
        const accuracy = ((sessions.reduce((sum, s) => sum + s.correctResponses, 0) / sessions.reduce((sum, s) => sum + s.totalTrials, 0)) * 100).toFixed(1);

        const percentage = (avgRT / maxAvgRT) * 100;

        chartHTML += `
            <div class="chart-group">
                <div class="group-label">${groupName}</div>
                <div class="group-stats">
                    <div class="stat-item">
                        <div class="bar" style="width: ${percentage}%; min-width: 50px;">
                            <span class="bar-text">${avgRT}ms</span>
                        </div>
                        <small>Avg RT (n=${sessions.length})</small>
                    </div>
                    <div class="stat-item">
                        <div class="stat-box errors">${totalErrors}</div>
                        <small>Total Errors</small>
                    </div>
                    <div class="stat-item">
                        <div class="stat-box accuracy">${accuracy}%</div>
                        <small>Accuracy</small>
                    </div>
                </div>
            </div>
        `;
    });

    chartHTML += '</div>';
    trendsChart.innerHTML = chartHTML;
}

function generateFactorAnalysis(groupedData, groupByFactor) {
    const factorAnalysis = document.getElementById('factorAnalysis');

    if (groupByFactor === 'none' || Object.keys(groupedData).length <= 1) {
        factorAnalysis.innerHTML = '';
        return;
    }

    let analysisHTML = '<div class="analysis-section"><h4>Factor-Based Observations</h4>';
    const observations = identifyPatterns(groupedData, groupByFactor);

    if (observations.length > 0) {
        observations.forEach(obs => {
            analysisHTML += `
                <div class="observation ${obs.type}">
                    <div class="obs-metrics">${obs.metrics}</div>
                    <div class="obs-conclusion">${obs.conclusion}</div>
                </div>
            `;
        });
    } else {
        analysisHTML += '<div class="observation neutral">Not enough data to identify clear patterns yet. Try more sessions with different factor combinations.</div>';
    }

    analysisHTML += '</div>';
    factorAnalysis.innerHTML = analysisHTML;
}

function identifyPatterns(groupedData, groupByFactor) {
    const observations = [];
    const groups = Object.entries(groupedData);

    if (groups.length < 2) return observations;

    const stats = groups.map(([name, sessions]) => ({
        name,
        avgRT: sessions.reduce((sum, s) => sum + (s.avgReactionTime || 0), 0) / sessions.length,
        minRT: Math.min(...sessions.map(s => s.avgReactionTime || Infinity)),
        maxRT: Math.max(...sessions.map(s => s.avgReactionTime || 0)),
        totalErrors: sessions.reduce((sum, s) => sum + s.errors, 0),
        accuracy: (sessions.reduce((sum, s) => sum + s.correctResponses, 0) / sessions.reduce((sum, s) => sum + s.totalTrials, 0)) * 100,
        count: sessions.length
    })).filter(s => s.count > 0);

    // Sort by relevant metric for better comparisons
    stats.sort((a, b) => a.avgRT - b.avgRT);

    // Generate detailed observations
    if (groupByFactor === 'stress') {
        observations.push(...generateStressObservations(stats));
    } else if (groupByFactor === 'fatigue') {
        observations.push(...generateFatigueObservations(stats));
    } else if (groupByFactor === 'stress-fatigue') {
        observations.push(...generateCombinedObservations(stats));
    }

    return observations.slice(0, 6); // Limit to 6 observations
}

function generateStressObservations(stats) {
    const observations = [];
    
    // Find low vs high stress comparison
    const lowStress = stats.find(s => s.name.includes('Low'));
    const highStress = stats.find(s => s.name.includes('High'));

    if (lowStress && highStress) {
        const rtDiff = highStress.avgRT - lowStress.avgRT;
        const rtPercent = ((rtDiff / lowStress.avgRT) * 100).toFixed(1);
        const errorDiff = highStress.totalErrors - lowStress.totalErrors;
        const accDiff = (highStress.accuracy - lowStress.accuracy).toFixed(1);

        observations.push({
            type: 'rt',
            metrics: `
                <strong>Sessions with stress > 50%:</strong> avg RT = ${Math.round(highStress.avgRT)}ms (${highStress.count} sessions)<br>
                <strong>Sessions with stress ≤ 50%:</strong> avg RT = ${Math.round(lowStress.avgRT)}ms (${lowStress.count} sessions)
            `,
            conclusion: `Stress impact: ${rtPercent > 0 ? '+' : ''}${rtPercent}% ${rtPercent > 0 ? 'slower' : 'faster'} reactions under higher stress. Higher stress correlates with delayed response times.`
        });
    }

    // Medium stress comparison
    const medStress = stats.find(s => s.name.includes('Medium'));
    if (lowStress && medStress && !observations.some(o => o.type === 'accuracy')) {
        const accDiff = (medStress.accuracy - lowStress.accuracy).toFixed(1);
        observations.push({
            type: 'accuracy',
            metrics: `
                <strong>Low Stress:</strong> Accuracy = ${lowStress.accuracy.toFixed(1)}% (${lowStress.totalErrors} errors)<br>
                <strong>Medium Stress:</strong> Accuracy = ${medStress.accuracy.toFixed(1)}% (${medStress.totalErrors} errors)
            `,
            conclusion: `Accuracy shift: ${accDiff > 0 ? '+' : ''}${accDiff}% ${accDiff > 0 ? 'improvement' : 'decline'} as stress increases. Mental clarity appears ${accDiff > 0 ? 'maintained' : 'affected'}.`
        });
    }

    // Error analysis
    if (highStress && lowStress && highStress.totalErrors > lowStress.totalErrors) {
        const errorIncrease = highStress.totalErrors - lowStress.totalErrors;
        observations.push({
            type: 'errors',
            metrics: `
                <strong>Low Stress:</strong> Total errors = ${lowStress.totalErrors}<br>
                <strong>High Stress:</strong> Total errors = ${highStress.totalErrors}
            `,
            conclusion: `❌ Error pattern: +${errorIncrease} more error(s) under high stress. Suggests reduced attentiveness when stressed.`
        });
    }

    return observations;
}

function generateFatigueObservations(stats) {
    const observations = [];
    
    const wellRested = stats.find(s => s.name.includes('Well-rested'));
    const veryTired = stats.find(s => s.name.includes('Very Tired'));
    const tired = stats.find(s => s.name.includes('Tired'));

    if (wellRested && veryTired) {
        const rtDiff = veryTired.avgRT - wellRested.avgRT;
        const rtPercent = ((rtDiff / wellRested.avgRT) * 100).toFixed(1);

        observations.push({
            type: 'rt',
            metrics: `
                <strong>Sessions with fatigue > 70%:</strong> avg RT = ${Math.round(veryTired.avgRT)}ms (${veryTired.count} sessions)<br>
                <strong>Sessions with fatigue ≤ 30%:</strong> avg RT = ${Math.round(wellRested.avgRT)}ms (${wellRested.count} sessions)
            `,
            conclusion: `Fatigue impact: ${rtPercent > 0 ? '+' : ''}${rtPercent}% ${rtPercent > 0 ? 'slower' : 'faster'} reactions when very tired. Sleep deprivation significantly slows performance.`
        });
    }

    if (wellRested && veryTired && veryTired.totalErrors > wellRested.totalErrors) {
        const errorIncrease = veryTired.totalErrors - wellRested.totalErrors;
        observations.push({
            type: 'errors',
            metrics: `
                <strong>Well-rested:</strong> Total errors = ${wellRested.totalErrors}<br>
                <strong>Very Tired:</strong> Total errors = ${veryTired.totalErrors}
            `,
            conclusion: `Error pattern: +${errorIncrease} more error(s) when very tired. Fatigue → reduced attention and more mistakes.`
        });
    }

    if (wellRested && veryTired && wellRested.accuracy > veryTired.accuracy) {
        const accDiff = (wellRested.accuracy - veryTired.accuracy).toFixed(1);
        observations.push({
            type: 'accuracy',
            metrics: `
                <strong>Well-rested:</strong> Accuracy = ${wellRested.accuracy.toFixed(1)}%<br>
                <strong>Very Tired:</strong> Accuracy = ${veryTired.accuracy.toFixed(1)}%
            `,
            conclusion: `Accuracy decline: -${accDiff}% when fatigued. Rest is critical for maintaining cognitive performance.`
        });
    }

    return observations;
}

function generateCombinedObservations(stats) {
    const observations = [];

    // Find high stress + low fatigue vs low stress + high fatigue
    const highStressLowFatigue = stats.find(s => s.name.includes('Stress:High') && s.name.includes('Rested'));
    const lowStressHighFatigue = stats.find(s => s.name.includes('Stress:Low') && s.name.includes('Tired'));
    const highBoth = stats.find(s => s.name.includes('Stress:High') && s.name.includes('V.Tired'));
    const lowBoth = stats.find(s => s.name.includes('Stress:Low') && s.name.includes('Rested'));

    if (highStressLowFatigue && lowStressHighFatigue) {
        const rtDiff = Math.abs(highStressLowFatigue.avgRT - lowStressHighFatigue.avgRT);
        const fasterGroup = highStressLowFatigue.avgRT > lowStressHighFatigue.avgRT ? 'Low Stress + High Fatigue' : 'High Stress + Low Fatigue';
        
        observations.push({
            type: 'rt',
            metrics: `
                <strong>High Stress + Well-rested:</strong> avg RT = ${Math.round(highStressLowFatigue.avgRT)}ms<br>
                <strong>Low Stress + Very Tired:</strong> avg RT = ${Math.round(lowStressHighFatigue.avgRT)}ms
            `,
            conclusion: `Factor comparison: Fatigue appears ${Math.abs(lowStressHighFatigue.avgRT - highStressLowFatigue.avgRT) > 50 ? 'more' : 'similarly'} impactful than stress. ${fasterGroup === 'Low Stress + High Fatigue' ? 'Rest matters more than stress levels.' : 'Stress management complements rest.'}`
        });
    }

    if (highBoth && lowBoth) {
        const rtPercent = (((highBoth.avgRT - lowBoth.avgRT) / lowBoth.avgRT) * 100).toFixed(1);
        observations.push({
            type: 'accuracy',
            metrics: `
                <strong>High Stress + Very Tired:</strong> avg RT = ${Math.round(highBoth.avgRT)}ms, Accuracy = ${highBoth.accuracy.toFixed(1)}%<br>
                <strong>Low Stress + Well-rested:</strong> avg RT = ${Math.round(lowBoth.avgRT)}ms, Accuracy = ${lowBoth.accuracy.toFixed(1)}%
            `,
            conclusion: `Combined effect: When both stress AND fatigue are high, performance drops by ${Math.abs(rtPercent)}%. Both factors together compound cognitive decline.`
        });
    }

    if (stats.length >= 3) {
        observations.push({
            type: 'neutral',
            metrics: `<strong>Observation:</strong> You have ${stats.length} different factor combinations tracked.`,
            conclusion: `Recommendation: Continue tracking sessions with varied stress/fatigue levels to identify your personal patterns and optimal performance conditions.`
        });
    }

    return observations;
}




// ===== HISTORY MODAL =====
function showHistory() {
    const modal = document.getElementById('historyModal');
    const historyList = document.getElementById('historyList');

    if (AppState.sessions.length === 0) {
        historyList.innerHTML = '<p style="text-align: center; color: #999;">No sessions recorded yet.</p>';
    } else {
        historyList.innerHTML = AppState.sessions
            .sort((a, b) => new Date(`${b.date} ${b.time}`) - new Date(`${a.date} ${a.time}`))
            .map((session, index) => `
                <div class="history-item">
                    <h4>${session.subTest}</h4>
                    <small>${session.date} ${session.time}</small>
                    <p>Score: ${session.score}/${session.totalTrials} | Accuracy: ${((session.correctResponses / session.totalTrials) * 100).toFixed(1)}%</p>
                    ${session.avgReactionTime ? `<p>Avg Reaction Time: ${session.avgReactionTime}ms</p>` : ''}
                    ${session.factors.stress !== null || session.factors.fatigue !== null ? `<small>Factors recorded: ${[
                        session.factors.stress !== null ? `Stress ${session.factors.stress}%` : '',
                        session.factors.fatigue !== null ? `Fatigue ${session.factors.fatigue}%` : ''
                    ].filter(x => x).join(', ')}</small>` : ''}
                </div>
            `).join('');
    }

    modal.style.display = 'flex';
}

function closeHistory() {
    document.getElementById('historyModal').style.display = 'none';
}

function clearHistory() {
    if (confirm('Are you sure you want to delete all session history? This cannot be undone.')) {
        AppState.sessions = [];
        saveSessionsToStorage();
        closeHistory();
    }
}
