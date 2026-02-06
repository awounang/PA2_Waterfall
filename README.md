# Cognitive Test App – Waterfall Implementation

A comprehensive web-based application for conducting advanced cognitive and attention tests with reaction time measurement, factor-based analysis, automatic insights, comprehensive session logging, and intelligent trend visualization.

## Features

### 1. Nine Scientifically-Designed Tests Across 3 Domains

#### **Reaction & Attention Tests (4 tests)**
- **Simple Reaction Time**: Dynamic colored shapes with distractor detection (10 trials)
- **Go/No-Go Test**: Selective response inhibition with visual stimuli (20 trials)
- **Stroop-like Reaction**: Color-word conflict resolution (15 trials)
- **Target vs Distractors**: Visual search with increasing complexity (12 trials)

#### **Working Memory Tests (3 tests)**
- **N-Back Test**: Sequence matching at 1-back and 2-back levels (20 trials)
- **Sequence Memory**: Visual sequence reproduction from 4x3 grid (5 sequences)
- **Spatial Memory**: Grid position recall and reproduction (5 trials)

#### **Executive Function Tests (2 tests)**
- **Simple Decision-Making**: Time-pressured trivia questions (15 trials, 8 sec/question)
- **Task Switching**: Mental flexibility with rule switching at trial 11 (20 trials)

### 2. Complete Test Workflow
- **Category-based test selection**: 3 test type categories
- **Detailed instructions**: Full procedures with visual examples for each test
- **Optional factor input panel**: Visible by default with collapsible controls
- **Interactive test execution**: Real-time feedback and progress tracking
- **Immediate results display**: Comprehensive scores and detailed metrics
- **Automatic insights**: Performance observations and pattern detection
- **Advanced trend analysis**: Factor-based grouping and comparison

### 3. Optional Factor Input (Enhanced)
Users can optionally provide personal factors before each test:
- **Stress Level**: 0-100% slider with labels (Low/Medium/High)
- **Fatigue Level**: 0-100% slider with labels (Well-rested/Tired/Very Tired)
- **Age**: Numeric input (optional)

All factors are optional and automatically compared across sessions for pattern analysis.

### 4. Session Logging & Storage
All sessions are automatically saved to browser LocalStorage with:
- Date and time of test
- Test category and sub-test name
- Score, accuracy, and reaction time metrics
- All individual reaction times recorded
- Number and types of errors
- Selected factors (if any provided)

### 5. Results Display with Automatic Insights
- **Performance Metrics**: Score, accuracy, reaction times, error count
- **Recorded Factors**: Display of any stress/fatigue/age data
- **Automatic Observations**: AI-generated insights including:
  - Attention dips (reaction time slowdown in test middle)
  - Factor impact analysis (how stress/fatigue affected this session)
  - Learning effects (improvement vs previous session)
  - Performance feedback (Excellent/Good/Room for Improvement)

### 6. Advanced Factor-Based Analysis & Trends
**Filter and Group By:**
- **None**: View all sessions
- **Stress Level**: Low/Medium/High grouping
- **Fatigue Level**: Well-rested/Tired/Very Tired grouping
- **Stress & Fatigue Combined**: All factor combinations

**Automatic Statistics Per Group:**
- Average Reaction Time (visual bar chart)
- Total Errors across group
- Overall Accuracy %
- Session count per group

**Intelligent Pattern Detection:**
- Identifies correlations like "Higher stress → slower reactions"
- Shows exact metrics: "Stress > 50%: avg RT = 480ms vs stress ≤ 50%: avg RT = 370ms"
- Compares multiple factors and their combined effects
- Detects which factor (stress or fatigue) has more impact
- Generates recommendations based on patterns

**Example Observation:**
```
Sessions with stress > 50%: avg RT = 480ms (5 sessions)
Sessions with stress ≤ 50%: avg RT = 370ms (8 sessions)

⏱️ Stress impact: +29.7% slower reactions under higher stress.
Higher stress correlates with delayed response times.
```

### 7. Session History
- View all previously completed tests with full details
- See date, time, scores, accuracy, and recorded factors
- Sort by most recent sessions
- Clear all history with confirmation

### 8. Dark Mode
- Toggle between dark and light modes from header button
- Button shows 🌙 (moon) in light mode → click to switch to dark mode
- Button shows ☀️ (sun) in dark mode → click to switch to light mode
- Preference is saved in browser localStorage

## Technical Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Storage**: Browser LocalStorage with JSON serialization
- **Graphics**: SVG for dynamic shape rendering
- **Responsive**: Mobile, tablet, and desktop friendly
- **No Dependencies**: Pure vanilla JavaScript – no frameworks required

## File Structure

```
PA2_Waterfall/
├── index.html       # Complete HTML with 7 screens and modal
├── styles.css       # Professional CSS with dark mode and responsive design
└── app.js           # Full JavaScript logic (2100+ lines)
```

## How to Use

1. **Open in Browser**: Simply open `index.html` in any modern web browser
2. **Select Test Category**: Choose Reaction & Attention, Working Memory, or Executive Function
3. **Select Sub-Test**: Pick the specific test you want to take
4. **Read Instructions**: Review test instructions and try example sequences
5. **Optional: Enter Factors**: Set stress, fatigue, and/or age (all optional)
6. **Start Test**: Click "Start Test" to begin
7. **Complete Test**: Follow on-screen instructions and complete all trials
8. **View Results**: See metrics, insights, and any automatic observations
9. **Analyze Trends**: 
   - Click "View Trends" to see Performance Trends
   - Filter by test type
   - Group by stress/fatigue to see factor impacts
   - View automatic pattern detection and observations
10. **Track History**: Click "📊 History" to see all previous sessions with factors

## Test Details

### Simple Reaction Test
- Measures pure reaction speed to dynamic colored shapes
- 10 trials with random target shapes and distractor shapes
- 7 vibrant colors used for shape coloring
- Tracks reaction time for each correct response
- Errors recorded for clicking wrong shapes

### Go/No-Go Test
- Measures response inhibition and selective attention
- 20 trials (~70% Go, ~30% No-Go) with random distribution
- Green circle = GO stimulus, other colors/shapes = NO-GO
- User must click on Go stimuli and withhold response on No-Go
- Tracks commission errors (false alarms) and correct responses

### Stroop-like Reaction Test
- Measures conflict resolution and color perception
- 15 trials with color words in mismatched ink colors
- User selects the actual ink color, not the word itself
- 4 color choices, randomly positioned each trial
- Demonstrates automatic nature of word reading

### Target vs Distractors Test
- Measures visual search and selective attention
- 12 trials with increasing complexity (3-7 distractors per trial)
- Target specified as color-shape combination (e.g., "Find the BLUE CIRCLE")
- 7 available colors (red, yellow, blue, pink, orange, green, purple)
- 3 available shapes (circle, square, triangle)

### N-Back Test
- Measures working memory and sequential processing
- 20 trials with shape sequence matching
- Trial 1: Display only (no error possible)
- Trial 2: Check if matches 1-back only
- Trial 3+: Check if matches 1-back OR 2-back
- User responds with MATCH or NO MATCH buttons

### Sequence Memory Test
- Measures short-term visual memory
- 5 sequences ranging from 4-6 items
- Sequence displays one item per second
- User reproduces sequence by clicking shapes in correct order
- Partial credit for partial sequence matches

### Spatial Memory Test
- Measures visuospatial working memory
- 5 trials with 4-6 grid positions flashing in sequence
- 3x3 grid where positions light up one at a time
- User clicks grid positions in same order they appeared
- Tracks accuracy of position sequence reproduction

### Simple Decision-Making Test
- Measures speed and accuracy under time pressure
- 15 trivia questions with 3 choices each
- 8 second time limit per question
- Randomly shuffled answer positions
- Tracks correct answers and response time

### Task Switching Test
- Measures mental flexibility and rule switching ability
- 20 trials (10 per rule)
- Trials 1-10: COLOR rule ("Click matching color")
- Trials 11-20: SHAPE rule ("Click matching shape")
- Tracks perseveration errors (applying old rule after switch)

## Results Metrics

For each test session, the following are recorded:

- **Score**: Number of correct responses
- **Total Trials**: Number of trials completed
- **Accuracy**: Percentage of correct responses
- **Average Reaction Time**: Mean reaction time across trials (ms)
- **Min/Max Reaction Time**: Fastest and slowest trial times
- **Errors**: Number of incorrect responses
- **Recorded Factors**: Stress, fatigue, and/or age if provided

## Automatic Insights Generated

The app automatically detects and reports:

1. **Attention Dips**: Reaction time slowdown in middle of test (>15% increase)
2. **Factor Impact**: How stress/fatigue affected performance
3. **Learning Effects**: Performance improvement or decline vs previous session
4. **Performance Feedback**: Achievement level based on accuracy
5. **Resilience**: Good performance despite high stress/fatigue
6. **Factor Correlations**: Which factors most strongly impact your performance

## Factor Analysis Observations

Group your sessions by factors and the app automatically identifies:

- **Reaction Time Differences**: "High stress shows +29.7% slower reactions"
- **Error Patterns**: "Very tired had 5 more errors than well-rested"
- **Accuracy Shifts**: "Low stress achieved 92% accuracy vs high stress's 78%"
- **Combined Effects**: "High stress + very tired = significant performance drop"
- **Factor Comparison**: "Fatigue has more impact than stress for you"

## Data Format

Sessions are stored in browser LocalStorage as JSON:

```json
{
  "date": "2026-02-06",
  "time": "14:30",
  "testType": "Reaction & Attention",
  "subTest": "Simple Reaction",
  "score": 9,
  "reactionTimes": [245, 320, 287, ...],
  "errors": 1,
  "totalTrials": 10,
  "correctResponses": 9,
  "avgReactionTime": 295,
  "factors": {
    "stress": 45,
    "fatigue": 30,
    "age": 28
  }
}
```

## Browser Compatibility

Works on all modern browsers supporting:
- ES6 JavaScript
- CSS Grid, Flexbox, and Variables
- HTML5 LocalStorage
- SVG rendering
- Tested on: Chrome, Firefox, Safari, Edge (latest versions)

## Key Features Implemented

✓ All 9 tests fully functional with specific logic  
✓ Three test categories with intuitive navigation  
✓ Dynamic shape rendering with SVG  
✓ Optional factor input with visible panel  
✓ Complete session logging to LocalStorage  
✓ Automatic insights and pattern detection  
✓ Advanced factor-based trend analysis  
✓ Metric-based observations with comparisons  
✓ Intelligent grouping by stress/fatigue/combined  
✓ Session history browser  
✓ Dynamic dark/light mode toggle (sun/moon icons)  
✓ Responsive mobile design  
✓ Professional, accessible UI  
✓ No external dependencies  

## Notes

- All data is stored locally in the browser – no server required
- Clearing browser cache or using incognito mode will reset history
- Factor inputs are optional but recommended for accurate analysis
- More sessions with varied factors = better pattern detection
- Tests follow Waterfall methodology principles
- Insights improve with more data (minimum 2-3 sessions with each factor level)

## Performance Tips

- Complete tests when well-rested for baseline performance measurement
- Record different stress/fatigue levels to identify personal patterns
- Repeat the same test multiple times to track improvements (learning effect)
- Use the "Group by Factor" feature to compare performance across conditions
- Review trends weekly to identify performance patterns
