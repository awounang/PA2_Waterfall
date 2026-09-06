/**
 * Unit checks for CognitiveUtils (no browser).
 *
 * Do not use the Playwright ▶ on this file — that is only for tests/e2e/*.spec.js
 *
 * PowerShell (npm.ps1 is often blocked):
 *   npm.cmd run test:unit
 * Or:
 *   node --test --test-reporter spec tests/unit/cts-ts-spec.test.js
 * One case:
 *   node --test --test-name-pattern "CTS-TS-012" tests/unit/cts-ts-spec.test.js
 *
 * Cursor: Run and Debug → "Unit tests (cts-ts-spec.test.js)"
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { CognitiveUtils } = require('../../utils.js');

describe('CTS-TS specification (unit)', () => {
    it('CTS-TS-002: factor labels match captured slider bands', () => {
        assert.equal(CognitiveUtils.getStressLabel(60), 'Medium Stress');
        assert.equal(CognitiveUtils.getFatigueLabel(40), 'Tired');
        assert.match(CognitiveUtils.getCaffeineLabel(25), /Moderate|Low/);
    });

    it('CTS-TS-012: accuracy, average RT against manual benchmarks', () => {
        assert.equal(CognitiveUtils.calculateAccuracy(8, 10), 80);
        assert.equal(CognitiveUtils.calculateAccuracy(12, 15), 80);
        assert.equal(CognitiveUtils.calculateAvgReactionTime([200, 300, 400]), 300);
        assert.equal(CognitiveUtils.calculateAvgReactionTime([]), 0);
    });

    it('CTS-TS-014: grouping by stress bands', () => {
        const groups = CognitiveUtils.groupSessionsByStress([
            { factors: { stress: 20 } },
            { factors: { stress: 60 } },
            { factors: { stress: 80 } },
            { factors: { stress: null } }
        ]);
        assert.equal(groups['Low Stress (≤30%)'].length, 1);
        assert.equal(groups['Medium Stress (31–70%)'].length, 1);
        assert.equal(groups['High Stress (>70%)'].length, 1);
    });
});
