/**
 * Music engine — the rules that turn abstract intervals into concrete pitches.
 *
 * Pure and deterministic (an RNG is injectable), so it is fully unit-testable
 * and free of any Phaser / Web Audio dependency. Game state lives elsewhere
 * (GameController); this module only computes.
 */

import { midiToFrequency, pcToMidi, toPitchClass, SEMITONES_PER_OCTAVE } from './notes';

/** Random source returning a float in [0, 1), like Math.random. */
export type Rng = () => number;

/**
 * Low octaves the drone may sit in, varied between games (project decision: 2).
 * Scientific pitch notation: octave 2 ~ C2 region.
 */
export const DRONE_OCTAVES = [2, 3] as const;

/** Setup fixed for the whole duration of one game. */
export interface RoundSetup {
    /** Tonic pitch class, 0..11. */
    tonicPc: number;
    /** Octave the drone sits in (one of DRONE_OCTAVES). */
    droneOctave: number;
    /** MIDI number of the drone's fundamental. */
    droneMidi: number;
}

function pick<T>(items: readonly T[], rng: Rng): T {
    return items[Math.floor(rng() * items.length)];
}

/** Pick a random tonic pitch class (0..11). */
export function randomTonic(rng: Rng = Math.random): number {
    return Math.floor(rng() * SEMITONES_PER_OCTAVE);
}

/** Pick a random drone octave among DRONE_OCTAVES. */
export function randomDroneOctave(rng: Rng = Math.random): number {
    return pick(DRONE_OCTAVES, rng);
}

/** Build the fixed setup for a new game. */
export function createRoundSetup(rng: Rng = Math.random): RoundSetup {
    const tonicPc = randomTonic(rng);
    const droneOctave = randomDroneOctave(rng);
    return {
        tonicPc,
        droneOctave,
        droneMidi: pcToMidi(tonicPc, droneOctave),
    };
}

/**
 * Choose the next interval to identify among the allowed ones.
 *
 * Uniform random, but never the same interval twice in a row (unless only a
 * single interval is allowed). `previous` is the interval from the last turn,
 * or null on the first turn.
 */
export function pickInterval(allowed: readonly number[], previous: number | null, rng: Rng = Math.random): number {
    if (allowed.length === 0) {
        throw new RangeError('pickInterval: no allowed intervals');
    }
    const pool =
        previous === null || allowed.length <= 1
            ? allowed
            : allowed.filter((interval) => interval !== previous);
    return pick(pool, rng);
}

/**
 * MIDI number of the note to identify for a given interval.
 *
 * Always one octave above the drone so every note sits in a consistent,
 * comfortable register regardless of the interval.
 */
export function noteMidiForInterval(setup: RoundSetup, interval: number): number {
    return setup.droneMidi + SEMITONES_PER_OCTAVE + toPitchClass(interval);
}

/** Frequency (Hz) of the note to identify for a given interval. */
export function noteFrequencyForInterval(setup: RoundSetup, interval: number): number {
    return midiToFrequency(noteMidiForInterval(setup, interval));
}

/** Frequency (Hz) of the drone's fundamental. */
export function droneFrequency(setup: RoundSetup): number {
    return midiToFrequency(setup.droneMidi);
}

/**
 * Validate an answer by comparing semitone positions on the wheel — never by
 * comparing note names (spec requirement).
 */
export function validateAnswer(expected: number, selected: number): boolean {
    return toPitchClass(expected) === toPitchClass(selected);
}
