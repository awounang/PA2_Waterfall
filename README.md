# Cognitive Test App – Waterfall Implementation

A complete web-based application for conducting cognitive and attention tests with reaction time measurement, comprehensive session logging, and trend analysis.

## Features

### 1. Four Scientifically-Designed Tests

#### Reaction Time Tests
- **Simple Reaction Test**: Measure basic response speed to a visual stimulus (10 trials)
- **Choice Reaction Test**: Respond to correct choice among multiple options (15 trials)

#### Attention Tests
- **Go/No-Go Test**: Respond only to "Go" signals, inhibit response to "No-Go" signals (20 trials)
- **Stroop Effect Test**: Select ink color of words printed in conflicting colors (15 trials)

### 2. Complete Test Workflow
- Home screen with test selection
- Detailed instructions for each test with visual examples
- Optional factor input panel (collapsible)
- Interactive test execution with real-time feedback
- Immediate results display with scores and metrics
- Performance trends visualization

### 3. Optional Factor Input
Users can optionally provide personal factors before each test:
- **Stress Level**: 0-100% slider with labels (Low/Medium/High)
- **Fatigue Level**: 0-100% slider with labels (Well-rested/Tired/Very Tired)
- **Age**: Numeric input (optional)

All factors are optional and the test can be started without filling them in.

### 4. Session Logging & Storage
All sessions are automatically saved to browser LocalStorage with:
- Date and time of test
- Test type and sub-test name
- Score and accuracy metrics
- All reaction times recorded
- Number of errors
- Selected factors (if any)

### 5. Results & Trend Analysis
- **Immediate Results**: Display score, average reaction time, error count, and accuracy after each test
- **Trend Visualization**: Simple bar charts showing:
  - Performance over multiple sessions
  - Filtering by test type
  - Filtering by factor conditions (stress/fatigue levels)
  - Performance comparison between different factor states

### 6. Session History
- View all previously completed tests
- See date, time, scores, and recorded factors
- Clear all history if needed

### 7. Dark Mode
- Toggle dark/light mode from the header
- Preference is saved in browser localStorage

## Technical Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Storage**: Browser LocalStorage
- **Responsive**: Mobile, tablet, and desktop friendly
- **No Dependencies**: Pure vanilla JavaScript – no frameworks required

## File Structure

```
PA2_Waterfall/
├── index.html       # Main HTML structure and UI
├── styles.css       # Complete CSS styling with dark mode support
└── app.js           # JavaScript application logic
```

## How to Use

1. **Open in Browser**: Simply open `index.html` in any modern web browser
2. **Select Test Type**: Choose between Reaction Time or Attention tests
3. **Select Sub-Test**: Pick the specific test you want to take
4. **Read Instructions**: Review test instructions and examples
5. **Optional: Enter Factors**: Click to expand and optionally provide stress, fatigue, and age
6. **Start Test**: Click "Start Test" to begin
7. **Complete Test**: Follow on-screen instructions and complete all trials
8. **View Results**: See your performance metrics immediately
9. **Track Trends**: View your performance over time with filtering options
10. **Check History**: Click "📊 History" to see all previous sessions

## Test Details

### Simple Reaction Test
- Measures pure reaction speed to a visual stimulus
- 10 trials with stimuli appearing at random intervals (1-2 seconds)
- Records reaction time for each successful response
- Provides immediate feedback

### Choice Reaction Test
- Measures decision speed when selecting from multiple options
- 15 trials with 3 color choices per trial
- Random target color varies each trial
- Tracks correct responses and reaction times
- Errors are recorded if wrong choice is selected

### Go/No-Go Test
- Measures response inhibition and selective attention
- 20 trials (~70% Go, ~30% No-Go)
- "Go" stimuli require immediate button click
- "No-Go" stimuli require withholding response
- Tracks hits, correct rejections, and false alarms

### Stroop Effect Test
- Measures conflict resolution and color perception
- 15 trials with color-word mismatches
- User selects the actual ink color, not the word
- Demonstrates the automatic nature of word reading
- Tracks accuracy and reaction times despite conflict

## Results Metrics

For each test session, the following metrics are recorded:

- **Score**: Number of correct responses
- **Total Trials**: Number of trials completed
- **Accuracy**: Percentage of correct responses
- **Average Reaction Time**: Mean reaction time across all trials (ms)
- **Errors**: Number of incorrect responses
- **Recorded Factors**: Any stress, fatigue, or age data entered

## Data Format

Sessions are stored in browser LocalStorage as JSON with the following structure:

```json
{
  "date": "YYYY-MM-DD",
  "time": "HH:MM",
  "testType": "Reaction Time" or "Attention",
  "subTest": "Simple Reaction", "Choice Reaction", "Go/No-Go", or "Stroop Effect",
  "score": 8,
  "reactionTimes": [245, 320, 287, ...],
  "errors": 2,
  "totalTrials": 10,
  "correctResponses": 8,
  "avgReactionTime": 295,
  "factors": {
    "stress": 50,
    "fatigue": 30,
    "age": 25
  }
}
```

## Browser Compatibility

Works on all modern browsers that support:
- ES6 JavaScript
- CSS Grid and Flexbox
- HTML5 LocalStorage
- Tested on: Chrome, Firefox, Safari, Edge (latest versions)

## Key Features Implemented

✓ All 4 sub-tests fully functional  
✓ Fixed timing intervals for consistent Waterfall implementation  
✓ Optional factor input (stress, fatigue, age)  
✓ Complete session logging to LocalStorage  
✓ Immediate results display  
✓ Trend visualization with filtering  
✓ Session history browser  
✓ Dark/light mode toggle  
✓ Responsive mobile design  
✓ Clean, professional UI  

## Notes

- All data is stored locally in the browser – no server is required
- Clearing browser cache or using incognito mode will reset history
- Tests follow Waterfall methodology with fixed, predetermined stimuli sequences and timing
- Perfect for cognitive research, baseline performance measurement, or personal tracking
