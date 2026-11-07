import { describe, it, expect } from 'vitest';
import { ScoreStorage, type KeyValueStore } from './ScoreStorage';
import { MAX_SCORE } from '../core/GameController';

function fakeStore(): KeyValueStore & { map: Map<string, string> } {
    const map = new Map<string, string>();
    return {
        map,
        getItem: (k) => map.get(k) ?? null,
        setItem: (k, v) => {
            map.set(k, v);
        },
    };
}

describe('ScoreStorage', () => {
    it('returns an empty record for an unknown selection', () => {
        const s = new ScoreStorage(fakeStore());
        expect(s.get('interval', 'thirds-fifth')).toEqual({ best: 0, mastered: false });
    });

    it('records a new best and reports it', () => {
        const s = new ScoreStorage(fakeStore());
        const r = s.record('interval', 'thirds-fifth', 5);
        expect(r.isNewBest).toBe(true);
        expect(r.record).toEqual({ best: 5, mastered: false });
        expect(s.get('interval', 'thirds-fifth').best).toBe(5);
    });

    it('keeps the previous best when the new score is lower', () => {
        const s = new ScoreStorage(fakeStore());
        s.record('interval', 'thirds-fifth', 8);
        const r = s.record('interval', 'thirds-fifth', 3);
        expect(r.isNewBest).toBe(false);
        expect(r.record.best).toBe(8);
    });

    it('marks mastery at MAX_SCORE and keeps it afterwards', () => {
        const s = new ScoreStorage(fakeStore());
        s.record('scale', 'major', MAX_SCORE);
        expect(s.get('scale', 'major')).toEqual({ best: MAX_SCORE, mastered: true });
        // A later weaker game must not clear mastery.
        s.record('scale', 'major', 2);
        expect(s.get('scale', 'major').mastered).toBe(true);
    });

    it('keeps records separate per mode and id', () => {
        const s = new ScoreStorage(fakeStore());
        s.record('interval', 'major', 4);
        s.record('scale', 'major', 9);
        expect(s.get('interval', 'major').best).toBe(4);
        expect(s.get('scale', 'major').best).toBe(9);
    });

    it('degrades gracefully on corrupted data', () => {
        const store = fakeStore();
        store.map.set('terval:score:interval:thirds-fifth', '{not json');
        const s = new ScoreStorage(store);
        expect(s.get('interval', 'thirds-fifth')).toEqual({ best: 0, mastered: false });
    });
});
