import { describe, it, expect } from 'vitest';
import { SCALES, getScale, allowedIntervalsForScale } from './scales';

describe('scales — definitions', () => {
    it('covers the base scales plus the full set of Greek modes', () => {
        expect(SCALES.map((s) => s.id)).toEqual([
            'major',
            'natural-minor',
            'major-pentatonic',
            'minor-pentatonic',
            'lydian',
            'mixolydian',
            'dorian',
            'phrygian',
            'locrian',
        ]);
    });

    it('keeps every scale well-formed: starts at 0, strictly ascending, within 0..11, unique', () => {
        for (const scale of SCALES) {
            expect(scale.degrees[0]).toBe(0);
            for (let i = 1; i < scale.degrees.length; i++) {
                expect(scale.degrees[i]).toBeGreaterThan(scale.degrees[i - 1]);
            }
            for (const degree of scale.degrees) {
                expect(degree).toBeGreaterThanOrEqual(0);
                expect(degree).toBeLessThanOrEqual(11);
            }
            expect(new Set(scale.degrees).size).toBe(scale.degrees.length);
        }
    });

    it('has the correct degrees for major and natural minor', () => {
        expect(getScale('major')?.degrees).toEqual([0, 2, 4, 5, 7, 9, 11]);
        expect(getScale('natural-minor')?.degrees).toEqual([0, 2, 3, 5, 7, 8, 10]);
        expect(getScale('major-pentatonic')?.degrees).toEqual([0, 2, 4, 7, 9]);
        expect(getScale('lydian')?.degrees).toEqual([0, 2, 4, 6, 7, 9, 11]);
        expect(getScale('locrian')?.degrees).toEqual([0, 1, 3, 5, 6, 8, 10]);
    });
});

describe('getScale', () => {
    it('returns known scales and undefined for unknown ids', () => {
        expect(getScale('dorian')?.name).toBe('Dorian');
        expect(getScale('nope')).toBeUndefined();
    });
});

describe('allowedIntervalsForScale', () => {
    it('returns the scale degrees as a fresh array', () => {
        const scale = getScale('major')!;
        const allowed = allowedIntervalsForScale(scale);
        expect(allowed).toEqual([...scale.degrees]);
        // Must be a copy, not the internal reference.
        allowed.push(99);
        expect(scale.degrees).not.toContain(99);
    });
});
