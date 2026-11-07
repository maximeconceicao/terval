import { describe, it, expect } from 'vitest';
import { INTERVALS, INTERVAL_COUNT, intervalOf, intervalName } from './intervals';

describe('intervals — the 12 wheel positions', () => {
    it('defines exactly 12 intervals', () => {
        expect(INTERVAL_COUNT).toBe(12);
    });

    it('indexes each interval by its semitone distance', () => {
        INTERVALS.forEach((interval, index) => {
            expect(interval.semitones).toBe(index);
        });
    });

    it('maps the canonical interval names (spec §4)', () => {
        expect(intervalName(0)).toBe('Octave');
        expect(intervalName(3)).toBe('Minor third');
        expect(intervalName(4)).toBe('Major third');
        expect(intervalName(5)).toBe('Perfect fourth');
        expect(intervalName(6)).toBe('Tritone');
        expect(intervalName(7)).toBe('Perfect fifth');
        expect(intervalName(11)).toBe('Major seventh');
    });

    it('throws on out-of-range semitones', () => {
        expect(() => intervalOf(12)).toThrow(RangeError);
        expect(() => intervalOf(-1)).toThrow(RangeError);
    });
});
