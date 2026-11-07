import { describe, it, expect } from 'vitest';
import { pcToMidi, pitchClassOf, toPitchClass, midiToFrequency } from './notes';
import {
    DRONE_OCTAVES,
    createRoundSetup,
    randomTonic,
    randomDroneOctave,
    pickInterval,
    noteMidiForInterval,
    noteFrequencyForInterval,
    droneFrequency,
    validateAnswer,
    type Rng,
} from './music-engine';

/** Deterministic RNG replaying a fixed sequence of values in [0, 1). */
function seqRng(values: number[]): Rng {
    let i = 0;
    return () => values[i++ % values.length];
}

describe('randomTonic — all 12 positions reachable', () => {
    it('stays within 0..11 for the full [0,1) range', () => {
        for (let r = 0; r < 1; r += 0.01) {
            const tonic = randomTonic(() => r);
            expect(tonic).toBeGreaterThanOrEqual(0);
            expect(tonic).toBeLessThanOrEqual(11);
        }
    });

    it('maps rng buckets to each of the 12 pitch classes', () => {
        for (let pc = 0; pc < 12; pc++) {
            expect(randomTonic(() => (pc + 0.5) / 12)).toBe(pc);
        }
    });
});

describe('randomDroneOctave — 2 registers (spec decision)', () => {
    it('returns one of the configured octaves', () => {
        expect(DRONE_OCTAVES).toEqual([2, 3]);
        expect(randomDroneOctave(() => 0)).toBe(2);
        expect(randomDroneOctave(() => 0.99)).toBe(3);
    });
});

describe('createRoundSetup', () => {
    it('keeps droneMidi consistent with tonic + octave', () => {
        // rng: tonic bucket -> 7/12 gives pc 7 (G); octave -> 0 gives octave 2.
        const setup = createRoundSetup(seqRng([7.5 / 12, 0]));
        expect(setup.tonicPc).toBe(7);
        expect(setup.droneOctave).toBe(2);
        expect(setup.droneMidi).toBe(pcToMidi(7, 2));
    });
});

describe('pickInterval — random, no immediate repeat', () => {
    it('throws when nothing is allowed', () => {
        expect(() => pickInterval([], null)).toThrow(RangeError);
    });

    it('always returns an allowed interval', () => {
        const allowed = [3, 4, 5, 7];
        for (let n = 0; n < 500; n++) {
            expect(allowed).toContain(pickInterval(allowed, null, Math.random));
        }
    });

    it('never repeats the previous interval when more than one is allowed', () => {
        const allowed = [3, 4, 7];
        for (const previous of allowed) {
            for (let n = 0; n < 300; n++) {
                expect(pickInterval(allowed, previous, Math.random)).not.toBe(previous);
            }
        }
    });

    it('returns the only interval even if it equals the previous one', () => {
        expect(pickInterval([5], 5, Math.random)).toBe(5);
    });

    it('selects uniformly from the pool after removing the previous', () => {
        // allowed [3,4,7], previous 4 -> pool [3,7]; rng 0 -> index 0 (3), rng ~1 -> index 1 (7).
        expect(pickInterval([3, 4, 7], 4, () => 0)).toBe(3);
        expect(pickInterval([3, 4, 7], 4, () => 0.99)).toBe(7);
    });
});

describe('noteMidiForInterval — register limits', () => {
    it('always plays at least one octave above the drone, within one octave band', () => {
        for (let tonic = 0; tonic < 12; tonic++) {
            for (const octave of DRONE_OCTAVES) {
                const setup = { tonicPc: tonic, droneOctave: octave, droneMidi: pcToMidi(tonic, octave) };
                for (let interval = 0; interval < 12; interval++) {
                    const midi = noteMidiForInterval(setup, interval);
                    expect(midi).toBeGreaterThanOrEqual(setup.droneMidi + 12);
                    expect(midi).toBeLessThanOrEqual(setup.droneMidi + 23);
                }
            }
        }
    });

    it('produces the pitch class matching tonic + interval', () => {
        for (let tonic = 0; tonic < 12; tonic++) {
            const setup = { tonicPc: tonic, droneOctave: 2, droneMidi: pcToMidi(tonic, 2) };
            for (let interval = 0; interval < 12; interval++) {
                const midi = noteMidiForInterval(setup, interval);
                expect(pitchClassOf(midi)).toBe(toPitchClass(tonic + interval));
            }
        }
    });
});

describe('frequency helpers', () => {
    it('derives note and drone frequencies from MIDI', () => {
        const setup = { tonicPc: 0, droneOctave: 2, droneMidi: pcToMidi(0, 2) };
        expect(droneFrequency(setup)).toBeCloseTo(midiToFrequency(setup.droneMidi), 6);
        expect(noteFrequencyForInterval(setup, 7)).toBeCloseTo(
            midiToFrequency(setup.droneMidi + 19),
            6,
        );
    });
});

describe('validateAnswer — compares positions, not note names', () => {
    it('accepts the matching position and rejects others', () => {
        expect(validateAnswer(7, 7)).toBe(true);
        expect(validateAnswer(7, 6)).toBe(false);
        expect(validateAnswer(0, 5)).toBe(false);
    });

    it('treats equivalent positions (0 and 12) as equal', () => {
        expect(validateAnswer(0, 12)).toBe(true);
        expect(validateAnswer(12, 0)).toBe(true);
    });
});
