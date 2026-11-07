/**
 * Shared game types.
 */

/** Which game mode a selection belongs to. */
export type GameMode = 'interval' | 'scale';

/**
 * A fully resolved choice handed from the menu to the game scene: the allowed
 * intervals to play plus the identity (mode + id) used as a persistence key.
 */
export interface GameSelection {
    mode: GameMode;
    /** Level id or scale id — unique within its mode. */
    id: string;
    /** Display name shown during play. */
    name: string;
    /** Allowed intervals, in semitones. */
    intervals: readonly number[];
}
