/**
 * Scales and modes.
 *
 * A scale is defined by the set of semitone offsets from its root (0..11).
 * In Scale/Mode game play, the allowed intervals on the wheel are exactly
 * these degrees — only notes belonging to the selected scale are active.
 */

export interface Scale {
    /** Stable identifier used as a persistence key. */
    id: string;
    /** Display name. */
    name: string;
    /** Semitone offsets from the root, ascending, always starting at 0. */
    degrees: readonly number[];
}

export const SCALES: readonly Scale[] = [
    { id: 'major', name: 'Major', degrees: [0, 2, 4, 5, 7, 9, 11] },
    { id: 'natural-minor', name: 'Natural Minor', degrees: [0, 2, 3, 5, 7, 8, 10] },
    { id: 'major-pentatonic', name: 'Major Pentatonic', degrees: [0, 2, 4, 7, 9] },
    { id: 'minor-pentatonic', name: 'Minor Pentatonic', degrees: [0, 3, 5, 7, 10] },
    { id: 'lydian', name: 'Lydian', degrees: [0, 2, 4, 6, 7, 9, 11] },
    { id: 'mixolydian', name: 'Mixolydian', degrees: [0, 2, 4, 5, 7, 9, 10] },
    { id: 'dorian', name: 'Dorian', degrees: [0, 2, 3, 5, 7, 9, 10] },
    { id: 'phrygian', name: 'Phrygian', degrees: [0, 1, 3, 5, 7, 8, 10] },
    { id: 'locrian', name: 'Locrian', degrees: [0, 1, 3, 5, 6, 8, 10] },
] as const;

const SCALES_BY_ID = new Map(SCALES.map((scale) => [scale.id, scale]));

/** Lookup a scale by id, or undefined if unknown. */
export function getScale(id: string): Scale | undefined {
    return SCALES_BY_ID.get(id);
}

/**
 * The intervals (semitone distances) that are selectable for a scale.
 * This is simply the scale's degrees — notes outside the scale stay disabled.
 */
export function allowedIntervalsForScale(scale: Scale): number[] {
    return [...scale.degrees];
}
