/**
 * Chromatic intervals.
 *
 * On the wheel each of the 12 positions represents an ascending interval,
 * measured in semitones above the tonic. The 12 o'clock position (0 semitones)
 * is labelled "Octave" because the note to identify is always played at least
 * one octave above the drone (see music-engine).
 */

export interface Interval {
    /** Distance in semitones above the tonic, 0..11. */
    semitones: number;
    /** Full name. */
    name: string;
    /** Short interval label (e.g. "P5"). */
    short: string;
    /** Scale-degree label shown on the wheel (e.g. "5", "b3"). */
    degree: string;
}

/** The 12 intervals, indexed by semitone distance (0..11). */
export const INTERVALS: readonly Interval[] = [
    { semitones: 0, name: 'Octave', short: '8ve', degree: '1' },
    { semitones: 1, name: 'Minor second', short: 'm2', degree: 'b2' },
    { semitones: 2, name: 'Major second', short: 'M2', degree: '2' },
    { semitones: 3, name: 'Minor third', short: 'm3', degree: 'b3' },
    { semitones: 4, name: 'Major third', short: 'M3', degree: '3' },
    { semitones: 5, name: 'Perfect fourth', short: 'P4', degree: '4' },
    { semitones: 6, name: 'Tritone', short: 'TT', degree: '#4' },
    { semitones: 7, name: 'Perfect fifth', short: 'P5', degree: '5' },
    { semitones: 8, name: 'Minor sixth', short: 'm6', degree: 'b6' },
    { semitones: 9, name: 'Major sixth', short: 'M6', degree: '6' },
    { semitones: 10, name: 'Minor seventh', short: 'm7', degree: 'b7' },
    { semitones: 11, name: 'Major seventh', short: 'M7', degree: '7' },
] as const;

export const INTERVAL_COUNT = INTERVALS.length;

/** Lookup an interval by its semitone distance (0..11). */
export function intervalOf(semitones: number): Interval {
    const interval = INTERVALS[semitones];
    if (!interval) {
        throw new RangeError(`Invalid interval: ${semitones} semitones (expected 0..11)`);
    }
    return interval;
}

/** Name of an interval by semitone distance. */
export function intervalName(semitones: number): string {
    return intervalOf(semitones).name;
}
