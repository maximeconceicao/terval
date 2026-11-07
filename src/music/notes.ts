/**
 * Chromatic note primitives.
 *
 * Pure, dependency-free music theory helpers. No Phaser, no Web Audio here.
 *
 * Conventions:
 * - A "pitch class" is an integer 0..11 where 0 = C, 1 = C#, ... 11 = B.
 * - A "MIDI number" encodes pitch + octave the standard way: 60 = C4, 69 = A4.
 *   pitchClass = midi mod 12.
 * - Note names use sharps only (project decision), e.g. C#, never Db.
 */

export const SEMITONES_PER_OCTAVE = 12;

/** Pitch-class names, indexed 0..11. Sharps only. */
export const PITCH_CLASS_NAMES = [
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
] as const;

/** Reference pitch: A4 = 440 Hz = MIDI 69. */
export const A4_MIDI = 69;
export const A4_FREQUENCY = 440;

/** Normalize any integer to a pitch class in 0..11. */
export function toPitchClass(value: number): number {
    return ((Math.round(value) % SEMITONES_PER_OCTAVE) + SEMITONES_PER_OCTAVE) % SEMITONES_PER_OCTAVE;
}

/** Pitch class of a MIDI number (0 = C ... 11 = B). */
export function pitchClassOf(midi: number): number {
    return toPitchClass(midi);
}

/** Human-readable name of a pitch class (sharps only). */
export function pitchClassName(pitchClass: number): string {
    return PITCH_CLASS_NAMES[toPitchClass(pitchClass)];
}

/**
 * Build a MIDI number from a pitch class and an octave.
 * Octave follows scientific pitch notation: C4 = MIDI 60, so octave 4 -> base 60.
 */
export function pcToMidi(pitchClass: number, octave: number): number {
    return (octave + 1) * SEMITONES_PER_OCTAVE + toPitchClass(pitchClass);
}

/** Equal-tempered frequency of a MIDI number, in Hz. */
export function midiToFrequency(midi: number): number {
    return A4_FREQUENCY * Math.pow(2, (midi - A4_MIDI) / SEMITONES_PER_OCTAVE);
}
