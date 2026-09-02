/**
 * CTS-TS E2E — 18 specification cases (Playwright)
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
    await openInstructions(page, category, heading);
    await page.getByRole('button', { name: 'Start Test' }).click();
    await expect(page.locator('#testScreen')).toHaveClass(/active/);
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

async function readAppState(page) {
    return page.evaluate(() => JSON.parse(JSON.stringify({
        currentScreen: AppState.currentScreen,
        selectedTest: AppState.selectedTest,
        isTestRunning: AppState.isTestRunning,
        factors: AppState.factors,
        testData: AppState.testData,
        sessions: AppState.sessions
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

});