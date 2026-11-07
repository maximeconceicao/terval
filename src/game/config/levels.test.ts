import { describe, it, expect } from 'vitest';
import { LEVELS, LEVEL_GROUPS } from './levels';

describe('Interval Training levels', () => {
    it('defines three families (minor, major, mixed)', () => {
        expect(LEVEL_GROUPS.map((g) => g.id)).toEqual(['minor', 'major', 'mixed']);
        expect(LEVEL_GROUPS.map((g) => g.levels.length)).toEqual([7, 7, 5]);
    });

    it('flattens to 19 levels with unique ids', () => {
        expect(LEVELS).toHaveLength(19);
        expect(new Set(LEVELS.map((l) => l.id)).size).toBe(19);
    });

    it('keeps every level non-empty with valid, unique, sorted intervals', () => {
        for (const level of LEVELS) {
            expect(level.intervals.length).toBeGreaterThan(0);
            expect(new Set(level.intervals).size).toBe(level.intervals.length);
            for (const semitones of level.intervals) {
                expect(semitones).toBeGreaterThanOrEqual(0);
                expect(semitones).toBeLessThanOrEqual(11);
            }
            const sorted = [...level.intervals].sort((a, b) => a - b);
            expect([...level.intervals]).toEqual(sorted);
        }
    });

    it('maps degree notation to the expected semitones', () => {
        const byName = new Map(LEVELS.map((l) => [l.name, [...l.intervals]]));
        expect(byName.get('1 3')).toEqual([0, 4]);
        expect(byName.get('1 b3 5')).toEqual([0, 3, 7]);
        expect(byName.get('1 b3 3 5')).toEqual([0, 3, 4, 7]);
        expect(byName.get('1 2 b3 4 5 b6 b7')).toEqual([0, 2, 3, 5, 7, 8, 10]);
    });

    it('culminates in a level covering all 12 intervals', () => {
        const last = LEVELS[LEVELS.length - 1];
        expect([...last.intervals]).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    });
});
