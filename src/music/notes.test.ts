import { describe, it, expect } from 'vitest';
import {
    PITCH_CLASS_NAMES,
    pitchClassName,
    pitchClassOf,
    toPitchClass,
    pcToMidi,
    midiToFrequency,
} from './notes';

describe('notes — 12 chromatic positions', () => {
    it('names all 12 pitch classes with sharps only', () => {
        expect(PITCH_CLASS_NAMES).toHaveLength(12);
        expect([...PITCH_CLASS_NAMES]).toEqual([
            'C',
            'C#',
            'D',
            'D#',
            'E',
            'F',
            'F#',
            'G',
            'G#',
            'A',
            'A#',
            'B',
        ]);
        // No flats anywhere.
        expect(PITCH_CLASS_NAMES.some((n) => n.includes('b'))).toBe(false);
    });

    it('resolves pitchClassName for each of the 12 positions', () => {
        for (let pc = 0; pc < 12; pc++) {
            expect(pitchClassName(pc)).toBe(PITCH_CLASS_NAMES[pc]);
        }
    });
});

describe('toPitchClass — wrapping', () => {
    it('wraps values above and below the octave', () => {
        expect(toPitchClass(12)).toBe(0);
        expect(toPitchClass(13)).toBe(1);
        expect(toPitchClass(24)).toBe(0);
        expect(toPitchClass(-1)).toBe(11);
        expect(toPitchClass(-12)).toBe(0);
        expect(toPitchClass(-13)).toBe(11);
    });
});

describe('pcToMidi / pitchClassOf', () => {
    it('places C4 at MIDI 60 and A4 at MIDI 69', () => {
        expect(pcToMidi(0, 4)).toBe(60); // C4
        expect(pcToMidi(9, 4)).toBe(69); // A4
        expect(pcToMidi(0, 2)).toBe(36); // C2
    });

    it('round-trips pitch class through MIDI', () => {
        for (let pc = 0; pc < 12; pc++) {
            for (const octave of [1, 2, 3, 4, 5]) {
                expect(pitchClassOf(pcToMidi(pc, octave))).toBe(pc);
            }
        }
    });
});

describe('midiToFrequency', () => {
    it('anchors A4 at 440 Hz', () => {
        expect(midiToFrequency(69)).toBeCloseTo(440, 6);
    });

    it('matches C4 ≈ 261.63 Hz', () => {
        expect(midiToFrequency(60)).toBeCloseTo(261.6256, 3);
    });

    it('doubles frequency per octave', () => {
        expect(midiToFrequency(72)).toBeCloseTo(midiToFrequency(60) * 2, 6);
        expect(midiToFrequency(48)).toBeCloseTo(midiToFrequency(60) / 2, 6);
    });
});
