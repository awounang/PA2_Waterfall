/**
 * CTS-TS E2E tests (Playwright)
 *
 * Run all:  npm.cmd run test:e2e
 * Run one:  npm.cmd run test:e2e -- -g "CTS-TS-001"
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
    await page.goto('/');
    await page.getByRole('button', { name: category }).click();
    await page.getByRole('heading', { name: heading }).click();
    await page.getByRole('button', { name: 'Start Test' }).click();
    await expect(page.locator('#testScreen')).toHaveClass(/active/);
}

async function readAppState(page) {
    return page.evaluate(() => JSON.parse(JSON.stringify({
        currentScreen: AppState.currentScreen,
        selectedTest: AppState.selectedTest,
        isTestRunning: AppState.isTestRunning
    })));
}

test.describe('CTS-TS specification', () => {
    test('CTS-TS-001: Workflow and screen-state control', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('#homeScreen')).toHaveClass(/active/);

        await page.getByRole('button', { name: 'Reaction & Attention' }).click();
        await expect(page.locator('#testSelectionScreen')).toHaveClass(/active/);
        await expect(page.locator('#homeScreen')).not.toHaveClass(/active/);

        await page.getByRole('heading', { name: 'Simple Reaction Time' }).click();
        await expect(page.locator('#instructionsScreen')).toHaveClass(/active/);
        await expect(page.locator('#instructionsTitle')).toContainText('Simple Reaction');

        await page.getByRole('button', { name: '← Back' }).click();
        await expect(page.locator('#homeScreen')).toHaveClass(/active/);
        let state = await readAppState(page);
        expect(state.selectedTest).toBeNull();
        expect(state.isTestRunning).toBe(false);

        await page.getByRole('button', { name: 'Working Memory' }).click();
        await expect(page.locator('#testSelectionScreen')).toHaveClass(/active/);
        await page.getByRole('button', { name: '← Back' }).click();
        await expect(page.locator('#homeScreen')).toHaveClass(/active/);

        await startModule(page, 'Reaction & Attention', 'Simple Reaction Time');
        state = await readAppState(page);
        expect(state.isTestRunning).toBe(true);
        expect(state.currentScreen).toBe('testScreen');

        await page.evaluate(() => goHome());
        await expect(page.locator('#homeScreen')).toHaveClass(/active/);
        state = await readAppState(page);
        expect(state.isTestRunning).toBe(false);
        expect(state.selectedTest).toBeNull();
    });

    test('CTS-TS-002: Personal factor input capture', async ({ page }) => {
        await openInstructions(page, 'Reaction & Attention', 'Simple Reaction Time');

        await setSlider(page, '#stressSlider', 60);
        await setSlider(page, '#fatigueSlider', 40);
        await setSlider(page, '#caffeineSlider', 25);
        await page.locator('#medicationToggle').check();

        await expect(page.locator('#stressValue')).toHaveText('60');
        await expect(page.locator('#fatigueValue')).toHaveText('40');
        await expect(page.locator('#caffeineValue')).toHaveText('25');
        await expect(page.locator('#medicationLabel')).toHaveText('Yes');

        const factors = await page.evaluate(() => AppState.factors);
        expect(factors).toEqual({ stress: 60, fatigue: 40, caffeine: 25, medication: true });

        await page.evaluate(() => {
            AppState.selectedTest = 'simple-reaction';
            AppState.currentTestType = 'reaction-attention';
            AppState.testData = {
                reactionTimes: [300],
                correctResponses: 9,
                totalTrials: 10,
                errors: 1,
                score: 9,
                startTime: Date.now(),
                endTime: Date.now()
            };
            saveSession();
        });

        const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('cognitiveTestSessions')));
        expect(stored).toHaveLength(1);
        expect(stored[0].factors).toEqual({ stress: 60, fatigue: 40, caffeine: 25, medication: true });
        expect(stored[0].subTest).toBe('Simple Reaction');
    });
});
