/**
 * CTS-TS E2E tests (Playwright) — spec IDs as test names, shared helpers above the suite.
 *
 * Run all:  npm.cmd run test:e2e
 * Run one:  npm.cmd run test:e2e -- -g "CTS-TS-001"
 * See window: npm.cmd run test:e2e:headed
 *
 * Each test() starts with a block comment: what the spec requires, then what the steps do.
 */
const { test, expect } = require('@playwright/test');
const { CognitiveUtils } = require('../../utils.js');

/** Set a range input and fire input/change so AppState.factors updates. */
async function setSlider(page, selector, value) {
    await page.locator(selector).evaluate((el, v) => {
        el.value = String(v);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
    }, value);
}

/** Home → category → subtest heading → instructions screen. */
async function openInstructions(page, category, heading) {
    await page.goto('/');
    await page.getByRole('button', { name: category }).click();
    await page.getByRole('heading', { name: heading }).click();
}

/** Open instructions and click Start Test (test screen must become active). */
async function startModule(page, category, heading) {
    await openInstructions(page, category, heading);
    await page.getByRole('button', { name: 'Start Test' }).click();
    await expect(page.locator('#testScreen')).toHaveClass(/active/);
}

/** Exactly one .screen.active, and it must be this id. */
async function expectOnlyScreen(page, screenId) {
    await expect(page.locator('.screen.active')).toHaveCount(1);
    await expect(page.locator(`#${screenId}`)).toHaveClass(/active/);
}

/** Copy of AppState for navigation / factor checks. */
async function readAppState(page) {
    return page.evaluate(() => JSON.parse(JSON.stringify({
        currentScreen: AppState.currentScreen,
        selectedTest: AppState.selectedTest,
        currentTestType: AppState.currentTestType,
        isTestRunning: AppState.isTestRunning,
        factors: AppState.factors,
        testData: AppState.testData,
        sessions: AppState.sessions
    })));
}

/** Live score counters (score, errors, correct, trials, RT list length). */
async function snapshotScores(page) {
    return page.evaluate(() => ({
        score: AppState.testData.score,
        errors: AppState.testData.errors,
        correctResponses: AppState.testData.correctResponses,
        totalTrials: AppState.testData.totalTrials,
        rtCount: AppState.testData.reactionTimes.length
    }));
}

/** Click the first SVG's inner shape (the outer svg intercepts pointer events). */
async function clickSimpleReactionTarget(page) {
    const shape = page.locator('#testContainer svg').first().locator('circle, rect, polygon').first();
    await expect(shape).toBeVisible();
    await shape.click({ force: true });
}

/**
 * Play all 10 Simple Reaction trials. missTrial (0-based) clicks a distractor.
 * Counts Correct/Wrong from on-screen feedback, not from AppState.
 */
async function completeSimpleReaction(page, { missTrial } = {}) {
    const observed = { correct: 0, errors: 0, reactionTimes: [], outcomes: [] };
    for (let i = 0; i < 10; i++) {
        await expect(page.locator('#testContainer svg').first()).toBeVisible({ timeout: 8000 });
        const svgCount = await page.locator('#testContainer svg').count();
        if (missTrial === i && svgCount > 1) {
            // Distractor is any SVG after the first (target is appended first).
            await page.locator('#testContainer svg').nth(1).locator('circle, rect, polygon').first().click({ force: true });
        } else {
            await clickSimpleReactionTarget(page);
        }
        const feedback = page.locator('#testContainer .feedback');
        await expect(feedback).toBeVisible({ timeout: 4000 });
        const msg = (await feedback.textContent()) || '';
        // Oracle for CTS-TS-012: tally from this text, not AppState.testData.
        if (msg.includes('Correct')) {
            observed.correct += 1;
            const rtMatch = msg.match(/(\d+)\s*ms/);
            if (rtMatch) observed.reactionTimes.push(Number(rtMatch[1]));
            observed.outcomes.push('correct');
        } else if (msg.includes('Wrong')) {
            observed.errors += 1;
            observed.outcomes.push('error');
        }
        if (i < 9) {
            await expect(page.locator('#testProgress')).toContainText(`Trial ${i + 2} of`, { timeout: 8000 });
        }
    }
    await expectOnlyScreen(page, 'resultsScreen');
    return observed;
}

/** After a trial: wait until progress text changes or the results screen opens. */
async function waitForNextTrialOrResults(page, prevProgress) {
    await page.waitForFunction((prev) => {
        const results = document.getElementById('resultsScreen');
        const progress = document.getElementById('testProgress');
        return (results && results.classList.contains('active'))
            || (progress && progress.textContent !== prev);
    }, prevProgress, { timeout: 8000 });
}

/** Map Stroop ink CSS (hex or rgb) to button labels Red / Blue / Green / Yellow. */
function inkNameFromCssColor(css) {
    const c = String(css || '').toLowerCase().replace(/\s/g, '');
    if (c.includes('208,2,27') || c.includes('#d0021b')) return 'Red';
    if (c.includes('74,144,226') || c.includes('#4a90e2')) return 'Blue';
    if (c.includes('126,211,33') || c.includes('#7ed321')) return 'Green';
    if (c.includes('245,166,35') || c.includes('#f5a623')) return 'Yellow';
    return null;
}

/**
 * After feedback: exactly one outcome. Hit → score, correct, RT +1.
 * Miss → errors +1; score and RT unchanged.
 */
async function assertBranchAfterFeedback(page, before, wantCorrect) {
    const after = await snapshotScores(page);
    // Guard against double-scoring: correct+errors must rise by exactly 1.
    expect(after.correctResponses + after.errors).toBe(before.correctResponses + before.errors + 1);
    if (wantCorrect) {
        expect(after.score).toBe(before.score + 1);
        expect(after.correctResponses).toBe(before.correctResponses + 1);
        expect(after.rtCount).toBe(before.rtCount + 1);
        expect(after.errors).toBe(before.errors);
    } else {
        expect(after.errors).toBe(before.errors + 1);
        expect(after.score).toBe(before.score);
        expect(after.rtCount).toBe(before.rtCount);
        expect(after.correctResponses).toBe(before.correctResponses);
    }
    return after;
}

/** Write cognitiveTestSessions and reload (available for history fixtures). */
async function seedSessions(page, sessions) {
    await page.goto('/');
    await page.evaluate((data) => {
        localStorage.setItem('cognitiveTestSessions', JSON.stringify(data));
    }, sessions);
    await page.reload();
}

/** Sample session payload for seeding history. */
function sampleSession(overrides = {}) {
    return {
        date: '2026-08-31',
        time: '15:00',
        testType: 'Reaction & Attention',
        subTest: 'Simple Reaction',
        score: 9,
        totalTrials: 10,
        correctResponses: 9,
        errors: 1,
        reactionTimes: [280, 300, 320],
        avgReactionTime: 300,
        factors: { stress: null, fatigue: null, caffeine: null, medication: null },
        ...overrides
    };
}

test.describe('CTS-TS specification', () => {
    /**
     * CTS-TS-001 — navigation and screen state.
     * Spec: walk home → category → subtest → instructions → test → results → selection → home;
     * only one screen active; Back/Home resets selection.
     * Steps: (1) each of 3 categories to instructions, Back home; (2) start Simple Reaction,
     * abort with goHome(); (3) complete the module, Try Another Test, Back home.
     */
    test('CTS-TS-001: Workflow and screen-state control', async ({ page }) => {
        test.setTimeout(90000);
        await page.goto('/');
        await expectOnlyScreen(page, 'homeScreen');

        const categories = [
            { button: 'Reaction & Attention', heading: 'Simple Reaction Time', type: 'reaction-attention', testId: 'simple-reaction' },
            { button: 'Working Memory', heading: 'N-Back Test', type: 'working-memory', testId: 'n-back' },
            { button: 'Executive Function', heading: 'Simple Decision-Making', type: 'executive-function', testId: 'decision-making' }
        ];

        // One subtest per category: open instructions, check AppState, Back resets to home.
        for (const cat of categories) {
            await page.getByRole('button', { name: cat.button }).click();
            await expectOnlyScreen(page, 'testSelectionScreen');
            await page.getByRole('heading', { name: cat.heading }).click();
            await expectOnlyScreen(page, 'instructionsScreen');
            await expect(page.locator('#instructionsTitle')).toContainText(cat.heading.includes('Decision') ? 'Decision' : cat.heading.replace(' Test', ''));
            const state = await readAppState(page);
            // Title and AppState must agree with the category we just opened.
            expect(state.currentTestType).toBe(cat.type);
            expect(state.selectedTest).toBe(cat.testId);
            await page.getByRole('button', { name: '← Back' }).click();
            await expectOnlyScreen(page, 'homeScreen');
            const afterBack = await readAppState(page);
            // Leaving instructions via Back must drop the subtest, not leave a half-selected flow.
            expect(afterBack.selectedTest).toBeNull();
            expect(afterBack.isTestRunning).toBe(false);
        }

        await startModule(page, 'Reaction & Attention', 'Simple Reaction Time');
        await expectOnlyScreen(page, 'testScreen');
        let state = await readAppState(page);
        // After Start Test the runtime flags must show this module is actually running.
        expect(state.selectedTest).toBe('simple-reaction');
        expect(state.currentTestType).toBe('reaction-attention');
        expect(state.isTestRunning).toBe(true);

        // Cancel a running test: Home must clear selectedTest and isTestRunning.
        await page.evaluate(() => goHome());
        await expectOnlyScreen(page, 'homeScreen');
        state = await readAppState(page);
        expect(state.selectedTest).toBeNull();
        expect(state.isTestRunning).toBe(false);

        // Full path: complete test → results → category list → home.
        await startModule(page, 'Reaction & Attention', 'Simple Reaction Time');
        await completeSimpleReaction(page);
        await expectOnlyScreen(page, 'resultsScreen');
        state = await readAppState(page);
        // Results is post-run: not running, but the completed subtest is still selected.
        expect(state.isTestRunning).toBe(false);
        expect(state.selectedTest).toBe('simple-reaction');

        await page.getByRole('button', { name: 'Try Another Test' }).click();
        await expectOnlyScreen(page, 'testSelectionScreen');
        // Stay in Reaction & Attention, do not jump to Home.
        await expect(page.locator('#testCategoryTitle')).toContainText('Reaction');

        await page.getByRole('button', { name: '← Back' }).click();
        await expectOnlyScreen(page, 'homeScreen');
        state = await readAppState(page);
        // Home is a full reset: no test, not running, no category.
        expect(state.selectedTest).toBeNull();
        expect(state.isTestRunning).toBe(false);
        expect(state.currentTestType).toBeNull();
    });

    /**
     * CTS-TS-002 — optional personal factors (stress, fatigue, caffeine, medication).
     * Spec: values across label bands, start without factors, complete a test, check
     * results/history/localStorage, then Clear Factors (reset after the saved run).
     */
    test('CTS-TS-002: Personal factor input capture', async ({ page }) => {
        test.setTimeout(120000);
        await openInstructions(page, 'Reaction & Attention', 'Simple Reaction Time');
        await expectOnlyScreen(page, 'instructionsScreen');

        // Factors must not block Start (leave sliders at 0, then abort).
        await page.getByRole('button', { name: 'Start Test' }).click();
        await expectOnlyScreen(page, 'testScreen');
        await page.evaluate(() => goHome());

        await openInstructions(page, 'Reaction & Attention', 'Simple Reaction Time');

        // Label thresholds (0 / 30–31 / 70–71 / 100) for stress, fatigue, caffeine.
        const stressCases = [
            [0, 'No stress (Baseline)'],
            [1, 'Low Stress'],
            [30, 'Low Stress'],
            [31, 'Medium Stress'],
            [70, 'Medium Stress'],
            [71, 'High Stress'],
            [100, 'High Stress']
        ];
        for (const [value, label] of stressCases) {
            await setSlider(page, '#stressSlider', value);
            await expect(page.locator('#stressValue')).toHaveText(String(value));
            await expect(page.locator('#stressLabel')).toHaveText(label);
        }

        const fatigueCases = [
            [0, 'Well-rested'],
            [30, 'Well-rested'],
            [31, 'Tired'],
            [70, 'Tired'],
            [71, 'Very Tired'],
            [100, 'Very Tired']
        ];
        for (const [value, label] of fatigueCases) {
            await setSlider(page, '#fatigueSlider', value);
            await expect(page.locator('#fatigueValue')).toHaveText(String(value));
            await expect(page.locator('#fatigueLabel')).toHaveText(label);
        }

        const caffeineCases = [
            [0, 'No caffeine'],
            [1, 'Low'],
            [20, 'Low'],
            [21, 'Moderate'],
            [50, 'Moderate'],
            [51, 'High'],
            [70, 'High'],
            [71, 'Very high'],
            [100, 'Very high']
        ];
        for (const [value, label] of caffeineCases) {
            await setSlider(page, '#caffeineSlider', value);
            await expect(page.locator('#caffeineValue')).toHaveText(String(value));
            await expect(page.locator('#caffeineLabel')).toContainText(label);
        }

        await expect(page.locator('#medicationLabel')).toHaveText('No');
        await page.locator('#medicationToggle').check();
        await expect(page.locator('#medicationLabel')).toHaveText('Yes');
        await page.locator('#medicationToggle').uncheck();
        await expect(page.locator('#medicationLabel')).toHaveText('No');

        // Values that will be stored with this session (not the sweep values above).
        await setSlider(page, '#stressSlider', 60);
        await setSlider(page, '#fatigueSlider', 40);
        await setSlider(page, '#caffeineSlider', 25);
        await page.locator('#medicationToggle').check();
        await expect(page.locator('#stressLabel')).toHaveText('Medium Stress');
        await expect(page.locator('#fatigueLabel')).toHaveText('Tired');
        await expect(page.locator('#caffeineLabel')).toContainText('Moderate');
        await expect(page.locator('#medicationLabel')).toHaveText('Yes');
        expect(await page.evaluate(() => AppState.factors)).toEqual({
            stress: 60, fatigue: 40, caffeine: 25, medication: true
        });

        await page.getByRole('button', { name: 'Start Test' }).click();
        await completeSimpleReaction(page);
        await expectOnlyScreen(page, 'resultsScreen');

        // Results, localStorage session, then history list.
        await expect(page.locator('#resultsContent')).toContainText('Stress Level');
        await expect(page.locator('#resultsContent')).toContainText('60%');
        await expect(page.locator('#resultsContent')).toContainText('Fatigue');
        await expect(page.locator('#resultsContent')).toContainText('40%');
        await expect(page.locator('#resultsContent')).toContainText('Caffeine');
        await expect(page.locator('#resultsContent')).toContainText('25%');
        await expect(page.locator('#resultsContent')).toContainText('On Medication');
        await expect(page.locator('#resultsContent')).toContainText('Yes');

        const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('cognitiveTestSessions')));
        const last = stored[stored.length - 1];
        // Persisted payload must match the sliders we set, not UI-only labels.
        expect(last.subTest).toBe('Simple Reaction');
        expect(last.factors).toEqual({ stress: 60, fatigue: 40, caffeine: 25, medication: true });

        await page.locator('#historyBtn').click();
        await expect(page.locator('#historyList')).toContainText('Simple Reaction');
        await expect(page.locator('#historyList')).toContainText('Stress 60%');
        await expect(page.locator('#historyList')).toContainText('Fatigue 40%');
        await page.getByRole('button', { name: 'Close' }).click();

        // Reset must happen after the saved run, not before.
        await page.locator('#resultsScreen').getByRole('button', { name: 'Try Another Test' }).click();
        await page.getByRole('heading', { name: 'Simple Reaction Time' }).click();
        await expectOnlyScreen(page, 'instructionsScreen');
        await page.getByRole('button', { name: 'Clear Factors' }).click();
        // Baseline: sliders 0, labels empty/No, AppState factors all null (not 0).
        await expect(page.locator('#stressValue')).toHaveText('0');
        await expect(page.locator('#fatigueValue')).toHaveText('0');
        await expect(page.locator('#caffeineValue')).toHaveText('0');
        await expect(page.locator('#stressLabel')).toHaveText('No stress (Baseline)');
        await expect(page.locator('#fatigueLabel')).toHaveText('Well-rested');
        await expect(page.locator('#caffeineLabel')).toHaveText('No caffeine');
        await expect(page.locator('#medicationLabel')).toHaveText('No');
        expect(await page.evaluate(() => AppState.factors)).toEqual({
            stress: null, fatigue: null, caffeine: null, medication: null
        });
    });

    /**
     * CTS-TS-003 — Simple Reaction scoring (10 trials).
     * Spec: mix target clicks and distractor clicks; hit adds score/correct/RT;
     * miss adds errors; test ends after 10; totals internally consistent.
     * Prompt text (CIRCLE / SQUARE / RECTANGLE) is mapped to the matching SVG.
     * Trials 2 and 8 (index 1, 7) are intentional misses.
     */
    test('CTS-TS-003: Simple Reaction module', async ({ page }) => {
        test.setTimeout(90000);
        await startModule(page, 'Reaction & Attention', 'Simple Reaction Time');
        await expect(page.locator('#testProgress')).toContainText('Trial 1 of 10');

        const missTrials = new Set([1, 7]);
        for (let i = 0; i < 10; i++) {
            await expect(page.locator('#testContainer')).toContainText(/Click the/i);
            await expect(page.locator('#testContainer svg').first()).toBeVisible({ timeout: 8000 });
            const prompt = (await page.locator('#testContainer p').first().textContent()) || '';
            const want = missTrials.has(i) ? 'error' : 'correct';
            const before = await snapshotScores(page);
            const progress = await page.locator('#testProgress').textContent();

            const svgs = page.locator('#testContainer svg');
            const n = await svgs.count();
            // Target plus distractors must all be on screen (prompt-among-shapes).
            expect(n).toBeGreaterThan(1);
            let clicked = false;
            for (let s = 0; s < n; s++) {
                const svg = svgs.nth(s);
                // Square vs rectangle: both are <rect>; square is ~equal width/height.
                const kind = await svg.evaluate((el) => {
                    if (el.querySelector('circle')) return 'CIRCLE';
                    const rect = el.querySelector('rect');
                    if (rect) {
                        const w = Number(rect.getAttribute('width'));
                        const h = Number(rect.getAttribute('height'));
                        return Math.abs(w - h) < 5 ? 'SQUARE' : 'RECTANGLE';
                    }
                    return 'TRIANGLE';
                });
                const isTarget = prompt.toUpperCase().includes(kind);
                if ((want === 'correct' && isTarget) || (want === 'error' && !isTarget)) {
                    await svg.locator('circle, rect, polygon').first().click({ force: true });
                    clicked = true;
                    break;
                }
            }
            expect(clicked).toBe(true);

            const feedback = page.locator('#testContainer .feedback');
            await expect(feedback).toBeVisible({ timeout: 4000 });
            if (want === 'correct') {
                await expect(feedback).toContainText(/Correct/i);
                await expect(feedback).toContainText(/ms/);
            } else {
                await expect(feedback).toContainText(/Wrong/i);
            }
            await assertBranchAfterFeedback(page, before, want === 'correct');
            await waitForNextTrialOrResults(page, progress);
        }

        await expectOnlyScreen(page, 'resultsScreen');
        const end = await snapshotScores(page);
        // Totals must match the 8 hits / 2 misses we scripted.
        expect(end.totalTrials).toBe(10);
        expect(end.correctResponses + end.errors).toBe(10);
        expect(end.score).toBe(end.correctResponses);
        expect(end.rtCount).toBe(end.correctResponses);
        expect(end.errors).toBe(missTrials.size);
        expect(end.correctResponses).toBe(10 - missTrials.size);
    });

    /**
     * CTS-TS-004 — Go/No-Go branches: Hit, Omission, Commission, Correct Rejection.
     * Green fill #7ed321 = GO. Click to collect Hit or Commission; wait (no click)
     * for Omission or Correct Rejection. Each trial must change exactly one counter.
     * Stops once all four feedback types have been seen (need not finish 20 trials).
     */
    test('CTS-TS-004: Go/No-Go module', async ({ page }) => {
        test.setTimeout(90000);
        await startModule(page, 'Reaction & Attention', 'Go/No-Go Test');
        await expect(page.locator('#testProgress')).toContainText('Trial 1 of 20');
        await expect(page.locator('#testContainer')).toContainText('GO:');

        const button = page.locator('#testControls .reaction-button');
        const seen = { hit: false, omit: false, commission: false, reject: false };

        for (let i = 0; i < 20 && Object.values(seen).includes(false); i++) {
            await expect(button).toBeEnabled({ timeout: 8000 });
            const trialText = await page.locator('#testProgress').textContent();
            const before = await snapshotScores(page);
            const fill = (await page.locator('#testContainer svg [fill]').first().getAttribute('fill')) || '';
            // App uses this green as GO; any other fill is NO-GO.
            const isGo = fill.toLowerCase() === '#7ed321';

            // Click while we still need a Hit (on GO) or a Commission (on NO-GO).
            if ((isGo && !seen.hit) || (!isGo && !seen.commission)) {
                await button.click();
            }

            await expect(page.locator('#testContainer .feedback')).toBeVisible({ timeout: 4000 });
            const msg = (await page.locator('#testContainer .feedback').textContent()) || '';
            const after = await snapshotScores(page);
            // One trial → exactly one of (correct | error) must increment.
            expect(after.correctResponses + after.errors).toBe(before.correctResponses + before.errors + 1);

            if (msg.includes('Hit')) {
                seen.hit = true;
                // GO + click: score and a reaction time, no error.
                expect(after.score).toBe(before.score + 1);
                expect(after.rtCount).toBe(before.rtCount + 1);
                expect(after.errors).toBe(before.errors);
            } else if (msg.includes('Omission')) {
                seen.omit = true;
                // GO + no click: error only (no RT).
                expect(after.errors).toBe(before.errors + 1);
                expect(after.score).toBe(before.score);
                expect(after.rtCount).toBe(before.rtCount);
            } else if (msg.includes('Commission')) {
                seen.commission = true;
                // NO-GO + click: false alarm, error only.
                expect(after.errors).toBe(before.errors + 1);
                expect(after.score).toBe(before.score);
                expect(after.rtCount).toBe(before.rtCount);
            } else if (msg.includes('Correct Rejection')) {
                seen.reject = true;
                // NO-GO + withhold: score +1, no RT (nothing to time).
                expect(after.score).toBe(before.score + 1);
                expect(after.errors).toBe(before.errors);
                expect(after.rtCount).toBe(before.rtCount);
            }

            await page.waitForFunction((prev) => {
                const results = document.getElementById('resultsScreen');
                const progress = document.getElementById('testProgress');
                return (results && results.classList.contains('active'))
                    || (progress && progress.textContent !== prev);
            }, trialText, { timeout: 8000 });

            if (await page.locator('#resultsScreen').evaluate((el) => el.classList.contains('active'))) break;
        }

        expect(seen.hit).toBe(true);
        expect(seen.omit).toBe(true);
        expect(seen.commission).toBe(true);
        expect(seen.reject).toBe(true);
    });

    /**
     * CTS-TS-005 — Stroop: click the INK colour, not the word (always incongruent).
     * Mix correct ink clicks and wrong colour clicks (trials 3 and 10).
     * 15 trials; same hit/miss metric branches as 003; totals must add up.
     */
    test('CTS-TS-005: Stroop-like reaction module', async ({ page }) => {
        test.setTimeout(90000);
        await startModule(page, 'Reaction & Attention', 'Stroop-like Reaction');
        await expect(page.locator('#testProgress')).toContainText('Trial 1 of 15');

        const missTrials = new Set([2, 9]);
        for (let i = 0; i < 15; i++) {
            await expect(page.locator('#testContainer')).toContainText(/INK/i);
            const choices = page.locator('#testControls .choice-button');
            await expect(choices).toHaveCount(4);

            // Word text vs CSS colour of the stimulus — they must differ (forced mismatch).
            const info = await page.evaluate(() => {
                const wordEl = [...document.querySelectorAll('#testContainer div')].find((el) => {
                    const s = el.getAttribute('style') || '';
                    return s.includes('font-weight') && s.includes('color');
                });
                const word = (wordEl && wordEl.textContent || '').trim();
                const inkCss = wordEl ? (wordEl.style.color || getComputedStyle(wordEl).color) : '';
                return { word, inkCss };
            });
            const ink = inkNameFromCssColor(info.inkCss);
            expect(ink).toBeTruthy();
            // Incongruent Stroop: the written word is never the ink colour.
            expect(info.word.toUpperCase()).not.toBe(ink.toUpperCase());

            const wantCorrect = !missTrials.has(i);
            const before = await snapshotScores(page);
            const progress = await page.locator('#testProgress').textContent();

            if (wantCorrect) {
                // Correct answer is the INK name (Red/Blue/…), not the word on screen.
                await page.getByRole('button', { name: ink, exact: true }).click();
            } else {
                const labels = await choices.allTextContents();
                const wrong = labels.find((name) => name !== ink);
                await page.getByRole('button', { name: wrong, exact: true }).click();
            }

            const feedback = page.locator('#testContainer .feedback');
            await expect(feedback).toBeVisible({ timeout: 4000 });
            if (wantCorrect) {
                await expect(feedback).toContainText(/Correct/i);
                await expect(feedback).toContainText(/ms/);
            } else {
                await expect(feedback).toContainText(/Incorrect/i);
            }
            await assertBranchAfterFeedback(page, before, wantCorrect);
            await waitForNextTrialOrResults(page, progress);
        }

        await expectOnlyScreen(page, 'resultsScreen');
        const end = await snapshotScores(page);
        // 15 trials, two scripted misses → 13 correct, 2 errors, RT list length = hits.
        expect(end.totalTrials).toBe(15);
        expect(end.correctResponses + end.errors).toBe(15);
        expect(end.score).toBe(end.correctResponses);
        expect(end.rtCount).toBe(end.correctResponses);
        expect(end.errors).toBe(missTrials.size);
    });

    /**
     * CTS-TS-006 — Target vs Distractors (12 trials, complexity rises).
     * Target SVG is drawn at width 60, distractors at 50. Mix hits and misses
     * on an early and a late trial. Last trial must have at least as many shapes as trial 1.
     */
    test('CTS-TS-006: Target vs Distractors module', async ({ page }) => {
        test.setTimeout(90000);
        await startModule(page, 'Reaction & Attention', 'Target vs Distractors');
        await expect(page.locator('#testProgress')).toContainText('Trial 1 of 12');

        const missTrials = new Set([0, 10]);
        let earlyCount = 0;
        for (let i = 0; i < 12; i++) {
            await expect(page.locator('#testContainer')).toContainText(/Find and click/i);
            const shapes = page.locator('#testContainer svg');
            await expect(shapes.first()).toBeVisible({ timeout: 8000 });
            const count = await shapes.count();
            expect(count).toBeGreaterThan(1);
            if (i === 0) earlyCount = count;
            // Later trials add distractors; last trial must not be simpler than trial 1.
            if (i === 11) expect(count).toBeGreaterThanOrEqual(earlyCount);

            const wantCorrect = !missTrials.has(i);
            const before = await snapshotScores(page);
            const progress = await page.locator('#testProgress').textContent();

            if (wantCorrect) {
                // App draws the target at 60px; distractors at 50px.
                await page.locator('#testContainer svg[width="60"]').locator('circle, rect, polygon').first().click({ force: true });
            } else {
                await page.locator('#testContainer svg[width="50"]').first().locator('circle, rect, polygon').first().click({ force: true });
            }

            const feedback = page.locator('#testContainer .feedback');
            await expect(feedback).toBeVisible({ timeout: 4000 });
            if (wantCorrect) {
                await expect(feedback).toContainText(/Found it/i);
                await expect(feedback).toContainText(/ms/);
            } else {
                await expect(feedback).toContainText(/Wrong/i);
            }
            await assertBranchAfterFeedback(page, before, wantCorrect);
            await waitForNextTrialOrResults(page, progress);
        }

        await expectOnlyScreen(page, 'resultsScreen');
        const end = await snapshotScores(page);
        expect(end.totalTrials).toBe(12);
        expect(end.correctResponses + end.errors).toBe(12);
        expect(end.score).toBe(end.correctResponses);
        expect(end.rtCount).toBe(end.correctResponses);
        expect(end.errors).toBe(missTrials.size);
    });


    /**
     * CTS-TS-007 — N-Back: trial 1 is passive (no MATCH buttons).
     * Trial 2: MATCH vs NO MATCH from 1-back (same shape as trial 1).
     * Then no-response: errors +1, score/RT unchanged, test still running.
     */
    test('CTS-TS-007: N-Back module', async ({ page }) => {
        test.setTimeout(60000);
        await startModule(page, 'Working Memory', 'N-Back Test');
        await expect(page.locator('#testProgress')).toContainText('Trial 1 of 20');
        await expect(page.locator('#testContainer svg')).toBeVisible();
        // Trial 1 is encoding only: MATCH / NO MATCH must not exist yet.
        await expect(page.locator('#testControls .reaction-button')).toHaveCount(0);

        const shapeOf = async () => {
            const svg = page.locator('#testContainer svg').first();
            if (await svg.locator('circle').count()) return 'circle';
            if (await svg.locator('rect').count()) return 'rect';
            return 'triangle';
        };
        const firstShape = await shapeOf();

        await expect(page.getByRole('button', { name: 'MATCH', exact: true })).toBeVisible({ timeout: 4000 });
        await expect(page.getByRole('button', { name: 'NO MATCH' })).toBeVisible();
        await expect(page.locator('#testProgress')).toContainText('Trial 2 of 20');

        // 1-back: MATCH if trial-2 shape equals trial-1 shape. Use exact: true so MATCH ≠ NO MATCH.
        const secondShape = await shapeOf();
        const shouldMatch = firstShape === secondShape;
        const beforeClick = await snapshotScores(page);
        await page.getByRole('button', { name: shouldMatch ? 'MATCH' : 'NO MATCH', exact: true }).click();
        await expect(page.locator('#testContainer .feedback')).toContainText('Correct');
        const afterClick = await snapshotScores(page);
        // Correct 1-back: one outcome, score+RT up, errors unchanged.
        expect(afterClick.correctResponses + afterClick.errors).toBe(beforeClick.correctResponses + beforeClick.errors + 1);
        expect(afterClick.score).toBe(beforeClick.score + 1);
        expect(afterClick.rtCount).toBe(beforeClick.rtCount + 1);
        expect(afterClick.errors).toBe(beforeClick.errors);

        // Deliberate timeout: do not click; errors must increase by 1 only.
        await expect(page.getByRole('button', { name: 'MATCH', exact: true })).toBeVisible({ timeout: 4000 });
        const beforeTimeout = await snapshotScores(page);
        await page.waitForFunction((prevErrors) => {
            return AppState.testData.errors > prevErrors;
        }, beforeTimeout.errors, { timeout: 5000 });
        const afterTimeout = await snapshotScores(page);
        expect(afterTimeout.errors).toBe(beforeTimeout.errors + 1);
        expect(afterTimeout.score).toBe(beforeTimeout.score);
        expect(afterTimeout.rtCount).toBe(beforeTimeout.rtCount);
        expect(afterTimeout.correctResponses + afterTimeout.errors)
            .toBe(beforeTimeout.correctResponses + beforeTimeout.errors + 1);

        const running = await page.evaluate(() => AppState.isTestRunning);
        expect(running).toBe(true);
        await expect(page.locator('#testProgress')).toContainText(/Trial [3-9]/);
    });

    /**
     * CTS-TS-010 — Decision-Making (15 trials, 8s limit).
     * Mix correct clicks, wrong clicks, and no-response timeouts.
     * Correct → score + RT; incorrect/timeout → errors only; one outcome per trial.
     */
    test('CTS-TS-010: Decision-Making module', async ({ page }) => {
        test.setTimeout(180000);
        const answers = {
            'Which shape has 4 equal sides?': 'Square',
            'What color is the sky?': 'Blue',
            'How many sides does a triangle have?': '3',
            'Which is a primary color?': 'Red',
            'What is 5 + 3?': '8',
            '2 × 4 = ?': '8',
            'Which is the largest?': '100',
            'Is a square a rectangle?': 'Yes',
            'How many sides does a pentagon have?': '5',
            'Which color is NOT a primary color?': 'Green',
            'What is the opposite of hot?': 'Cold',
            'How many legs does a spider have?': '8',
            'Is ice solid or liquid?': 'Solid',
            'Which is fastest?': 'Airplane',
            'Is the Earth flat?': 'No'
        };
        const wrongTrials = new Set([1, 8]);
        const timeoutTrials = new Set([4, 12]);

        await startModule(page, 'Executive Function', 'Simple Decision-Making');
        await expect(page.locator('#testProgress')).toContainText('Trial 1 of 15');

        for (let i = 0; i < 15; i++) {
            const question = ((await page.locator('#testContainer p').first().textContent()) || '').trim();
            const correctLabel = answers[question];
            expect(correctLabel).toBeTruthy();
            const choices = page.locator('#testControls .choice-button');
            await expect(choices).toHaveCount(3);

            const before = await snapshotScores(page);
            const progress = await page.locator('#testProgress').textContent();
            const labels = await choices.allTextContents();
            // Options are shuffled; we still pick by the known correct label.
            expect(labels).toContain(correctLabel);

            if (timeoutTrials.has(i)) {
                // No click: 8s limit must score as error, not hang.
                const feedback = page.locator('#testContainer .feedback');
                await expect(feedback).toContainText(/Time's up/i, { timeout: 12000 });
                await assertBranchAfterFeedback(page, before, false);
            } else {
                const wantCorrect = !wrongTrials.has(i);
                if (wantCorrect) {
                    await page.getByRole('button', { name: correctLabel, exact: true }).click();
                } else {
                    const wrong = labels.find((name) => name !== correctLabel);
                    await page.getByRole('button', { name: wrong, exact: true }).click();
                }
                const feedback = page.locator('#testContainer .feedback');
                await expect(feedback).toBeVisible({ timeout: 4000 });
                if (wantCorrect) {
                    await expect(feedback).toContainText(/Correct/i);
                    await expect(feedback).toContainText(/ms/);
                } else {
                    await expect(feedback).toContainText(/Incorrect/i);
                }
                await assertBranchAfterFeedback(page, before, wantCorrect);
            }
            await waitForNextTrialOrResults(page, progress);
        }

        await expectOnlyScreen(page, 'resultsScreen');
        const end = await snapshotScores(page);
        // 11 hits, 2 wrong, 2 timeouts.
        expect(end.totalTrials).toBe(15);
        expect(end.correctResponses + end.errors).toBe(15);
        expect(end.score).toBe(end.correctResponses);
        expect(end.rtCount).toBe(end.correctResponses);
        expect(end.errors).toBe(wrongTrials.size + timeoutTrials.size);
        expect(end.correctResponses).toBe(15 - wrongTrials.size - timeoutTrials.size);
    });

    /**
     * CTS-TS-011 — Task Switching: trials 1–10 colour rule, 11–20 shape rule.
     * Correct clicks follow the cue; after the switch we force at least one
     * perseverative error (still matching colour when the rule is shape).
     */
    test('CTS-TS-011: Task Switching module', async ({ page }) => {
        test.setTimeout(120000);
        await startModule(page, 'Executive Function', 'Task Switching');
        await expect(page.locator('#testProgress')).toContainText('Trial 1 of 20');

        let perseverated = false;
        for (let i = 0; i < 20; i++) {
            const byColor = i < 10;
            if (byColor) {
                await expect(page.locator('#testContainer')).toContainText(/matching COLOR/i);
            } else {
                // Rule cue must change at trial 11.
                await expect(page.locator('#testContainer')).toContainText(/matching SHAPE/i);
            }

            const before = await snapshotScores(page);
            const progress = await page.locator('#testProgress').textContent();
            const meta = await page.evaluate(() => {
                const span = document.querySelector('#testContainer span');
                const targetCss = span ? (span.style.color || getComputedStyle(span).color) : '';
                const prompt = (document.querySelectorAll('#testContainer p')[1]?.textContent || '').toLowerCase();
                const buttons = [...document.querySelectorAll('#testControls .choice-button')];
                const options = buttons.map((btn) => {
                    const fill = btn.querySelector('[fill]')?.getAttribute('fill') || '';
                    const svg = btn.querySelector('svg');
                    let kind = 'square';
                    if (svg?.querySelector('circle')) kind = 'circle';
                    else if (svg?.querySelector('polygon')) kind = 'triangle';
                    return { fill, kind };
                });
                return { targetCss, prompt, options };
            });

            const targetInk = inkNameFromCssColor(meta.targetCss);
            const colorIdx = meta.options.findIndex((opt) => inkNameFromCssColor(opt.fill) === targetInk);
            const shapeIdx = meta.options.findIndex((opt) => meta.prompt.includes(opt.kind));
            expect(colorIdx).toBeGreaterThanOrEqual(0);

            let clickIdx = colorIdx;
            let wantCorrect = true;
            if (!byColor) {
                expect(shapeIdx).toBeGreaterThanOrEqual(0);
                if (!perseverated && colorIdx !== shapeIdx) {
                    // Old colour rule after the switch = perseverative error.
                    clickIdx = colorIdx;
                    wantCorrect = false;
                    perseverated = true;
                } else if (!perseverated && i === 19) {
                    clickIdx = [0, 1, 2].find((j) => j !== shapeIdx);
                    wantCorrect = false;
                    perseverated = true;
                } else {
                    clickIdx = shapeIdx;
                    wantCorrect = true;
                }
            }

            await page.locator('#testControls .choice-button').nth(clickIdx).click();
            const feedback = page.locator('#testContainer .feedback');
            await expect(feedback).toBeVisible({ timeout: 4000 });
            if (wantCorrect) {
                await expect(feedback).toContainText(/Correct/i);
                await expect(feedback).toContainText(/ms/);
            } else {
                await expect(feedback).toContainText(/Incorrect/i);
            }
            await assertBranchAfterFeedback(page, before, wantCorrect);
            await waitForNextTrialOrResults(page, progress);
        }

        expect(perseverated).toBe(true);
        await expectOnlyScreen(page, 'resultsScreen');
        const end = await snapshotScores(page);
        expect(end.totalTrials).toBe(20);
        expect(end.correctResponses + end.errors).toBe(20);
        expect(end.score).toBe(end.correctResponses);
        expect(end.rtCount).toBe(end.correctResponses);
        expect(end.errors).toBeGreaterThanOrEqual(1);
    });

    /**
     * CTS-TS-012 — results screen vs metrics counted from trial feedback.
     * Mixed outcomes (one distractor click). Expected score/accuracy/avg RT come from
     * observed Correct/Wrong text, not from AppState.
     * DEMO: active line expects 999/10 so the case FAILS on purpose (report + screenshot).
     * Restore the commented line for a green run.
     */
    test('CTS-TS-012: Result computation and display', async ({ page }) => {
        test.setTimeout(90000);
        await startModule(page, 'Reaction & Attention', 'Simple Reaction Time');
        const observed = await completeSimpleReaction(page, { missTrial: 2 });

        expect(observed.outcomes).toHaveLength(10);
        expect(observed.errors).toBeGreaterThanOrEqual(1);
        expect(observed.correct).toBeGreaterThanOrEqual(1);
        // Mixed run: every trial classified from feedback, hits + misses = 10.
        expect(observed.correct + observed.errors).toBe(10);

        const expectedAccuracy = CognitiveUtils.calculateAccuracy(observed.correct, 10);
        const expectedAvg = CognitiveUtils.calculateAvgReactionTime(observed.reactionTimes);
        const results = page.locator('#resultsContent');
        // DEMO FAIL: 999/10 is not on the page. Real check is the commented line.
        // await expect(results).toContainText(`${observed.correct}/10`);
        await expect(results).toContainText('999/10');
        // These still compare the rest of the results text to the independent tally.
        await expect(results).toContainText(`${expectedAccuracy}`);
        await expect(results).toContainText(`${observed.errors}`);
        await expect(results).toContainText(`${expectedAvg}ms`);
        await expect(results).toContainText('Accuracy');
        await expect(results).toContainText('Summary');
        await expect(results).toContainText(`${observed.correct} correct`);
    });

    /**
     * CTS-TS-013 — persistence: two Simple Reaction sessions (stress 20 then 80),
     * reload, history still shows both; a second tab sees the same localStorage.
     */
    test('CTS-TS-013: Session persistence', async ({ page }) => {
        test.setTimeout(120000);
        await openInstructions(page, 'Reaction & Attention', 'Simple Reaction Time');
        await setSlider(page, '#stressSlider', 20);
        await page.getByRole('button', { name: 'Start Test' }).click();
        await completeSimpleReaction(page);
        await expectOnlyScreen(page, 'resultsScreen');
        // Session 1: low stress. Go home so we can start a second session.
        await page.locator('#resultsScreen').getByRole('button', { name: /Home/ }).click();
        await openInstructions(page, 'Reaction & Attention', 'Simple Reaction Time');
        // Session 2: high stress, same module, so history can show both factor values.
        await setSlider(page, '#stressSlider', 80);
        await page.getByRole('button', { name: 'Start Test' }).click();
        await completeSimpleReaction(page);
        await expectOnlyScreen(page, 'resultsScreen');

        // Two stored Simple Reaction sessions with different stress values.
        const beforeReload = await page.evaluate(() => JSON.parse(localStorage.getItem('cognitiveTestSessions')));
        expect(beforeReload.length).toBeGreaterThanOrEqual(2);
        expect(beforeReload.some((s) => s.subTest === 'Go/No-Go' || s.subTest === 'Simple Reaction')).toBe(true);
        const stressed = beforeReload.filter((s) => s.subTest === 'Simple Reaction');
        expect(stressed.length).toBeGreaterThanOrEqual(2);
        expect(stressed.some((s) => s.factors.stress === 20)).toBe(true);
        expect(stressed.some((s) => s.factors.stress === 80)).toBe(true);

        await page.reload();
        const afterReload = await page.evaluate(() => JSON.parse(localStorage.getItem('cognitiveTestSessions')));
        // Refresh must not drop or duplicate sessions.
        expect(afterReload).toHaveLength(beforeReload.length);

        await page.locator('#historyBtn').click();
        await expect(page.locator('#historyList')).toContainText('Simple Reaction');
        await expect(page.locator('#historyList')).toContainText('Stress 20%');
        await expect(page.locator('#historyList')).toContainText('Stress 80%');

        // Same origin: new tab must see the same history.
        const page2 = await page.context().newPage();
        await page2.goto('/');
        await page2.locator('#historyBtn').click();
        await expect(page2.locator('#historyList')).toContainText('Simple Reaction');
        await expect(page2.locator('#historyList')).toContainText('Stress 20%');
        await page2.close();
    });
});
