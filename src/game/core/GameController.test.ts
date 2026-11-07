import { describe, it, expect } from 'vitest';
import { GameController, TOTAL_ROUNDS, MAX_SCORE } from './GameController';

const ALL = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

/** Answer the current target correctly. */
function answerCorrect(c: GameController) {
    return c.submit(c.target);
}

/** Answer with a deliberately wrong interval. */
function answerWrong(c: GameController) {
    const wrong = ALL.find((i) => i !== c.target)!;
    return c.submit(wrong);
}

describe('GameController — lifecycle', () => {
    it('starts in idle and requires start()', () => {
        const c = new GameController();
        expect(c.status).toBe('idle');
        expect(() => c.setup).toThrow();
    });

    it('start() opens round 1, awaiting, score 0, valid target', () => {
        const c = new GameController();
        c.start([3, 4, 7]);
        expect(c.status).toBe('awaiting');
        expect(c.score).toBe(0);
        expect(c.round).toBe(1);
        expect([3, 4, 7]).toContain(c.target);
    });

    it('throws when started with no allowed intervals', () => {
        expect(() => new GameController().start([])).toThrow(RangeError);
    });
});

describe('GameController — a wrong answer no longer ends the game', () => {
    it('keeps playing and does not increment the score on a wrong answer', () => {
        const c = new GameController();
        c.start([3, 4, 7]);
        const r = answerWrong(c);
        expect(r.correct).toBe(false);
        expect(r.score).toBe(0);
        expect(r.status).toBe('awaiting');
        expect(c.round).toBe(2);
    });

    it('reports the expected interval so the UI can reveal it', () => {
        const c = new GameController();
        c.start([3, 4, 7]);
        const target = c.target;
        const r = answerWrong(c);
        expect(r.expected).toBe(target);
    });

    it('increments the score only on correct answers', () => {
        const c = new GameController();
        c.start([3, 4, 7]);
        answerCorrect(c);
        answerWrong(c);
        answerCorrect(c);
        expect(c.score).toBe(2);
        expect(c.round).toBe(4);
    });
});

describe('GameController — fixed run of TOTAL_ROUNDS', () => {
    it('finishes after exactly TOTAL_ROUNDS answers', () => {
        const c = new GameController();
        c.start(ALL);
        for (let i = 0; i < TOTAL_ROUNDS - 1; i++) {
            expect(answerCorrect(c).status).toBe('awaiting');
        }
        const last = answerCorrect(c);
        expect(last.round).toBe(TOTAL_ROUNDS);
        expect(last.status).toBe('finished');
    });

    it('scores a perfect game at MAX_SCORE', () => {
        const c = new GameController();
        c.start(ALL);
        for (let i = 0; i < TOTAL_ROUNDS; i++) {
            answerCorrect(c);
        }
        expect(c.score).toBe(MAX_SCORE);
        expect(c.status).toBe('finished');
    });

    it('counts a mixed game correctly out of TOTAL_ROUNDS', () => {
        const c = new GameController();
        c.start(ALL);
        let expected = 0;
        for (let i = 0; i < TOTAL_ROUNDS; i++) {
            if (i % 2 === 0) {
                answerCorrect(c);
                expected++;
            } else {
                answerWrong(c);
            }
        }
        expect(c.status).toBe('finished');
        expect(c.score).toBe(expected);
    });
});

describe('GameController — single tonic for the whole game', () => {
    it('keeps the same setup across all rounds', () => {
        const c = new GameController();
        c.start(ALL);
        const firstSetup = c.setup;
        for (let i = 0; i < TOTAL_ROUNDS - 1; i++) {
            answerCorrect(c);
            expect(c.setup).toBe(firstSetup);
        }
    });
});

describe('GameController — ignores input once finished', () => {
    it('is a no-op after the game is finished', () => {
        const c = new GameController();
        c.start(ALL);
        for (let i = 0; i < TOTAL_ROUNDS; i++) {
            answerCorrect(c);
        }
        const after = answerCorrect(c);
        expect(after.status).toBe('finished');
        expect(c.score).toBe(MAX_SCORE);
    });
});
