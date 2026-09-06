/**
 * CTS-TS E2E tests (Playwright)
 *
 * Run all:  npm.cmd run test:e2e
 * Run one:  npm.cmd run test:e2e -- -g "CTS-TS-001"
 * See window: npm.cmd run test:e2e:headed
 */
const { test, expect } = require('@playwright/test');

async function setSlider(page, selector, value) {
    await page.locator(selector).evaluate((el, v) => {
        el.value = String(v);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
    }, value);
}

async function openInstructions(page, category, heading) {
    await page.goto('/');
    await page.getByRole('button', { name: category }).click();
    await page.getByRole('heading', { name: heading }).click();
}

async function startModule(page, category, heading) {
    await openInstructions(page, category, heading);
    await page.getByRole('button', { name: 'Start Test' }).click();
    await expect(page.locator('#testScreen')).toHaveClass(/active/);
}

async function expectOnlyScreen(page, screenId) {
    await expect(page.locator('.screen.active')).toHaveCount(1);
    await expect(page.locator(`#${screenId}`)).toHaveClass(/active/);
}

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

async function snapshotScores(page) {
    return page.evaluate(() => ({
        score: AppState.testData.score,
        errors: AppState.testData.errors,
        correctResponses: AppState.testData.correctResponses,
        totalTrials: AppState.testData.totalTrials,
        rtCount: AppState.testData.reactionTimes.length
    }));
}

async function clickSimpleReactionTarget(page) {
    const shape = page.locator('#testContainer svg').first().locator('circle, rect, polygon').first();
    await expect(shape).toBeVisible();
    await shape.click({ force: true });
}

async function completeSimpleReaction(page, { missTrial } = {}) {
    for (let i = 0; i < 10; i++) {
        await expect(page.locator('#testContainer svg').first()).toBeVisible({ timeout: 8000 });
        if (missTrial === i && (await page.locator('#testContainer svg').count()) > 1) {
            await page.locator('#testContainer svg').nth(1).locator('circle, rect, polygon').first().click({ force: true });
        } else {
            await clickSimpleReactionTarget(page);
        }
        if (i < 9) {
            await expect(page.locator('#testProgress')).toContainText(`Trial ${i + 2} of`, { timeout: 8000 });
        }
    }
    await expectOnlyScreen(page, 'resultsScreen');
}

async function seedSessions(page, sessions) {
    await page.goto('/');
    await page.evaluate((data) => {
        localStorage.setItem('cognitiveTestSessions', JSON.stringify(data));
    }, sessions);
    await page.reload();
}

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
    test('CTS-TS-001: Workflow and screen-state control', async ({ page }) => {
        test.setTimeout(90000);
        await page.goto('/');
        await expectOnlyScreen(page, 'homeScreen');

        const categories = [
            { button: 'Reaction & Attention', heading: 'Simple Reaction Time', type: 'reaction-attention', testId: 'simple-reaction' },
            { button: 'Working Memory', heading: 'N-Back Test', type: 'working-memory', testId: 'n-back' },
            { button: 'Executive Function', heading: 'Simple Decision-Making', type: 'executive-function', testId: 'decision-making' }
        ];

        for (const cat of categories) {
            await page.getByRole('button', { name: cat.button }).click();
            await expectOnlyScreen(page, 'testSelectionScreen');
            await page.getByRole('heading', { name: cat.heading }).click();
            await expectOnlyScreen(page, 'instructionsScreen');
            await expect(page.locator('#instructionsTitle')).toContainText(cat.heading.includes('Decision') ? 'Decision' : cat.heading.replace(' Test', ''));
            const state = await readAppState(page);
            expect(state.currentTestType).toBe(cat.type);
            expect(state.selectedTest).toBe(cat.testId);
            await page.getByRole('button', { name: '← Back' }).click();
            await expectOnlyScreen(page, 'homeScreen');
            const afterBack = await readAppState(page);
            expect(afterBack.selectedTest).toBeNull();
            expect(afterBack.isTestRunning).toBe(false);
        }

        await startModule(page, 'Reaction & Attention', 'Simple Reaction Time');
        await expectOnlyScreen(page, 'testScreen');
        let state = await readAppState(page);
        expect(state.selectedTest).toBe('simple-reaction');
        expect(state.currentTestType).toBe('reaction-attention');
        expect(state.isTestRunning).toBe(true);

        await completeSimpleReaction(page);
        await expectOnlyScreen(page, 'resultsScreen');
        state = await readAppState(page);
        expect(state.isTestRunning).toBe(false);
        expect(state.selectedTest).toBe('simple-reaction');

        await page.getByRole('button', { name: 'Try Another Test' }).click();
        await expectOnlyScreen(page, 'testSelectionScreen');
        await expect(page.locator('#testCategoryTitle')).toContainText('Reaction');

        await page.getByRole('button', { name: '← Back' }).click();
        await expectOnlyScreen(page, 'homeScreen');
        state = await readAppState(page);
        expect(state.selectedTest).toBeNull();
        expect(state.isTestRunning).toBe(false);
        expect(state.currentTestType).toBeNull();
    });

    test('CTS-TS-002: Personal factor input capture', async ({ page }) => {
        test.setTimeout(90000);
        await openInstructions(page, 'Reaction & Attention', 'Simple Reaction Time');

        await page.getByRole('button', { name: 'Start Test' }).click();
        await expectOnlyScreen(page, 'testScreen');
        await page.evaluate(() => goHome());

        await openInstructions(page, 'Reaction & Attention', 'Simple Reaction Time');
        await setSlider(page, '#stressSlider', 60);
        await setSlider(page, '#fatigueSlider', 40);
        await setSlider(page, '#caffeineSlider', 25);
        await page.locator('#medicationToggle').check();

        await expect(page.locator('#stressValue')).toHaveText('60');
        await expect(page.locator('#stressLabel')).toHaveText('Medium Stress');
        await expect(page.locator('#fatigueValue')).toHaveText('40');
        await expect(page.locator('#fatigueLabel')).toHaveText('Tired');
        await expect(page.locator('#caffeineValue')).toHaveText('25');
        await expect(page.locator('#caffeineLabel')).toContainText('Moderate');
        await expect(page.locator('#medicationLabel')).toHaveText('Yes');

        await page.getByRole('button', { name: 'Clear Factors' }).click();
        await expect(page.locator('#stressValue')).toHaveText('0');
        await expect(page.locator('#fatigueValue')).toHaveText('0');
        await expect(page.locator('#caffeineValue')).toHaveText('0');
        await expect(page.locator('#stressLabel')).toHaveText('No stress (Baseline)');
        await expect(page.locator('#medicationLabel')).toHaveText('No');
        const cleared = await page.evaluate(() => AppState.factors);
        expect(cleared).toEqual({ stress: null, fatigue: null, caffeine: null, medication: null });

        await setSlider(page, '#stressSlider', 60);
        await setSlider(page, '#fatigueSlider', 40);
        await setSlider(page, '#caffeineSlider', 25);
        await page.locator('#medicationToggle').check();

        await page.getByRole('button', { name: 'Start Test' }).click();
        await completeSimpleReaction(page);

        await expect(page.locator('#resultsContent')).toContainText('Stress Level');
        await expect(page.locator('#resultsContent')).toContainText('60%');
        await expect(page.locator('#resultsContent')).toContainText('Fatigue');
        await expect(page.locator('#resultsContent')).toContainText('Caffeine');
        await expect(page.locator('#resultsContent')).toContainText('On Medication');

        const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('cognitiveTestSessions')));
        const last = stored[stored.length - 1];
        expect(last.factors).toEqual({ stress: 60, fatigue: 40, caffeine: 25, medication: true });
        expect(last.subTest).toBe('Simple Reaction');

        await page.locator('#historyBtn').click();
        await expect(page.locator('#historyList')).toContainText('Simple Reaction');
        await expect(page.locator('#historyList')).toContainText('Stress 60%');
        await expect(page.locator('#historyList')).toContainText('Fatigue 40%');
    });

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
            const fill = (await page.locator('#testContainer svg [fill]').first().getAttribute('fill')) || '';
            const isGo = fill.toLowerCase() === '#7ed321';

            if ((isGo && !seen.hit) || (!isGo && !seen.commission)) {
                await button.click();
            }

            await expect(page.locator('#testContainer .feedback')).toBeVisible({ timeout: 4000 });
            const msg = (await page.locator('#testContainer .feedback').textContent()) || '';
            if (msg.includes('Hit')) seen.hit = true;
            else if (msg.includes('Omission')) seen.omit = true;
            else if (msg.includes('Commission')) seen.commission = true;
            else if (msg.includes('Correct Rejection')) seen.reject = true;

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

    test('CTS-TS-007: N-Back module', async ({ page }) => {
        test.setTimeout(60000);
        await startModule(page, 'Working Memory', 'N-Back Test');
        await expect(page.locator('#testProgress')).toContainText('Trial 1 of 20');
        await expect(page.locator('#testContainer svg')).toBeVisible();
        await expect(page.locator('#testControls .reaction-button')).toHaveCount(0);

        await expect(page.getByRole('button', { name: 'MATCH', exact: true })).toBeVisible({ timeout: 4000 });
        await expect(page.getByRole('button', { name: 'NO MATCH' })).toBeVisible();
        await expect(page.locator('#testProgress')).toContainText('Trial 2 of 20');

        const beforeClick = await snapshotScores(page);
        await page.getByRole('button', { name: 'NO MATCH' }).click();
        await expect(page.locator('#testContainer .feedback')).toBeVisible();
        const afterClick = await snapshotScores(page);
        expect(afterClick.correctResponses + afterClick.errors).toBe(beforeClick.correctResponses + beforeClick.errors + 1);

        await expect(page.getByRole('button', { name: 'MATCH', exact: true })).toBeVisible({ timeout: 4000 });
        const beforeTimeout = await snapshotScores(page);
        await page.waitForFunction((prevErrors) => {
            return AppState.testData.errors > prevErrors;
        }, beforeTimeout.errors, { timeout: 5000 });
        const afterTimeout = await snapshotScores(page);
        expect(afterTimeout.errors).toBeGreaterThan(beforeTimeout.errors);

        const running = await page.evaluate(() => AppState.isTestRunning);
        expect(running).toBe(true);
        await expect(page.locator('#testProgress')).toContainText(/Trial [3-9]/);
    });

    test('CTS-TS-012: Result computation and display', async ({ page }) => {
        test.setTimeout(90000);
        await startModule(page, 'Reaction & Attention', 'Simple Reaction Time');
        await completeSimpleReaction(page, { missTrial: 2 });

        const check = await page.evaluate(() => {
            const d = AppState.testData;
            const accuracy = CognitiveUtils.calculateAccuracy(d.correctResponses, d.totalTrials);
            const avg = CognitiveUtils.calculateAvgReactionTime(d.reactionTimes);
            return {
                d,
                accuracy,
                avg,
                text: document.getElementById('resultsContent').innerText
            };
        });

        expect(check.d.totalTrials).toBe(10);
        expect(check.d.correctResponses + check.d.errors).toBeGreaterThanOrEqual(10);
        expect(check.d.score).toBe(check.d.correctResponses);
        expect(check.text).toContain(`${check.d.score}/${check.d.totalTrials}`);
        expect(check.text).toContain(`${check.accuracy}`);
        expect(check.text).toContain(`${check.d.errors}`);
        if (check.d.reactionTimes.length > 0) {
            expect(check.text).toContain(`${check.avg}ms`);
        }
        await expect(page.locator('#resultsContent')).toContainText('Accuracy');
        await expect(page.locator('#resultsContent')).toContainText('Summary');
        expect(check.d.errors).toBeGreaterThanOrEqual(1);
        expect(check.d.correctResponses).toBeGreaterThanOrEqual(1);
    });

    test('CTS-TS-013: Session persistence', async ({ page }) => {
        test.setTimeout(120000);
        await openInstructions(page, 'Reaction & Attention', 'Simple Reaction Time');
        await setSlider(page, '#stressSlider', 20);
        await page.getByRole('button', { name: 'Start Test' }).click();
        await completeSimpleReaction(page);
        await expectOnlyScreen(page, 'resultsScreen');
        await page.locator('#resultsScreen').getByRole('button', { name: /Home/ }).click();
        await openInstructions(page, 'Reaction & Attention', 'Simple Reaction Time');
        await setSlider(page, '#stressSlider', 80);
        await page.getByRole('button', { name: 'Start Test' }).click();
        await completeSimpleReaction(page);
        await expectOnlyScreen(page, 'resultsScreen');

        const beforeReload = await page.evaluate(() => JSON.parse(localStorage.getItem('cognitiveTestSessions')));
        expect(beforeReload.length).toBeGreaterThanOrEqual(2);
        expect(beforeReload.some((s) => s.subTest === 'Go/No-Go' || s.subTest === 'Simple Reaction')).toBe(true);
        const stressed = beforeReload.filter((s) => s.subTest === 'Simple Reaction');
        expect(stressed.length).toBeGreaterThanOrEqual(2);
        expect(stressed.some((s) => s.factors.stress === 20)).toBe(true);
        expect(stressed.some((s) => s.factors.stress === 80)).toBe(true);

        await page.reload();
        const afterReload = await page.evaluate(() => JSON.parse(localStorage.getItem('cognitiveTestSessions')));
        expect(afterReload).toHaveLength(beforeReload.length);

        await page.locator('#historyBtn').click();
        await expect(page.locator('#historyList')).toContainText('Simple Reaction');
        await expect(page.locator('#historyList')).toContainText('Stress 20%');
        await expect(page.locator('#historyList')).toContainText('Stress 80%');

        const page2 = await page.context().newPage();
        await page2.goto('/');
        await page2.locator('#historyBtn').click();
        await expect(page2.locator('#historyList')).toContainText('Simple Reaction');
        await expect(page2.locator('#historyList')).toContainText('Stress 20%');
        await page2.close();
    });
});
