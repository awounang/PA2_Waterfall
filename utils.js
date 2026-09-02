/**
 * Shared helpers used by the Cognitive Test Suite UI (browser)
 * and by Node unit tests (CommonJS).
 */
(function (root) {
    function round1(value) {
        return Math.round(value * 10) / 10;
    }

    const CognitiveUtils = {
        getStressLabel(value) {
            if (value === null || value === undefined || Number(value) === 0) {
                return 'No stress (Baseline)';
            }
            const v = Number(value);
            if (v <= 30) return 'Low Stress';
            if (v <= 70) return 'Medium Stress';
            return 'High Stress';
        },

        getFatigueLabel(value) {
            if (value === null || value === undefined || Number(value) === 0) {
                return 'Well-rested';
            }
            const v = Number(value);
            if (v <= 30) return 'Well-rested';
            if (v <= 70) return 'Tired';
            return 'Very Tired';
        },

        getCaffeineLabel(value) {
            if (value === null || value === undefined || Number(value) === 0) {
                return 'No caffeine';
            }
            const v = Number(value);
            if (v <= 20) return 'Low';
            if (v <= 50) return 'Moderate';
            if (v <= 70) return 'High (strong alertness)';
            return 'Very high (may jitter)';
        },

        calculateAvgReactionTime(reactionTimes) {
            if (!Array.isArray(reactionTimes) || reactionTimes.length === 0) {
                return 0;
            }
            const sum = reactionTimes.reduce((a, b) => a + b, 0);
            return Math.round(sum / reactionTimes.length);
        },

        calculateAccuracy(correctResponses, totalTrials) {
            if (!totalTrials) return 0;
            return round1((correctResponses / totalTrials) * 100);
        },

        groupSessionsByStress(sessions) {
            const groups = {
                'Low Stress (≤30%)': [],
                'Medium Stress (31–70%)': [],
                'High Stress (>70%)': []
            };
            (sessions || []).forEach((session) => {
                const v = session.factors && session.factors.stress;
                if (v === null || v === undefined) return;
                if (v <= 30) groups['Low Stress (≤30%)'].push(session);
                else if (v <= 70) groups['Medium Stress (31–70%)'].push(session);
                else groups['High Stress (>70%)'].push(session);
            });
            return groups;
        },

        groupSessionsByFatigue(sessions) {
            const groups = {
                'Well-rested (≤30%)': [],
                'Tired (31–70%)': [],
                'Very Tired (>70%)': []
            };
            (sessions || []).forEach((session) => {
                const v = session.factors && session.factors.fatigue;
                if (v === null || v === undefined) return;
                if (v <= 30) groups['Well-rested (≤30%)'].push(session);
                else if (v <= 70) groups['Tired (31–70%)'].push(session);
                else groups['Very Tired (>70%)'].push(session);
            });
            return groups;
        },

        groupSessionsByStressAndFatigue(sessions) {
            const groups = {};
            const stressBand = (v) => {
                if (v === null || v === undefined) return 'Stress:n/a';
                if (v <= 30) return 'Stress:Low';
                if (v <= 70) return 'Stress:Med';
                return 'Stress:High';
            };
            const fatigueBand = (v) => {
                if (v === null || v === undefined) return 'Fatigue:n/a';
                if (v <= 30) return 'Rested';
                if (v <= 70) return 'Tired';
                return 'V.Tired';
            };
            (sessions || []).forEach((session) => {
                const f = session.factors || {};
                const name = `${stressBand(f.stress)} / ${fatigueBand(f.fatigue)}`;
                if (!groups[name]) groups[name] = [];
                groups[name].push(session);
            });
            return groups;
        }
    };

    root.CognitiveUtils = CognitiveUtils;
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { CognitiveUtils };
    }
})(typeof globalThis !== 'undefined' ? globalThis : this);
