/**
 * Interval Training levels (spec §5.1) — practical interval paths.
 *
 * Levels are grouped into three families (minor, major, mixed) and expressed as
 * scale-degree notation ("1 b3 5", "1 2 3 5 6", …) exactly as a player reads
 * them on a handpan. Each degree maps to a semitone distance above the tonic,
 * so the game engine keeps working on raw semitones while the UI shows degrees.
 *
 * Difficulty grows inside each family by widening the set of degrees. Levels are
 * not unlocked sequentially — the player picks freely.
 */

export interface Level {
    /** Stable identifier, used as a persistence key. */
    id: string;
    /** Degree notation shown to the player, e.g. "1 b3 5". */
    name: string;
    /** Allowed intervals, in semitones (ascending). */
    intervals: readonly number[];
}

export interface LevelGroup {
    /** Stable identifier for the family. */
    id: string;
    /** Family display name. */
    name: string;
    levels: readonly Level[];
}

/** Scale-degree token → semitone distance above the tonic (0..11). */
const DEGREE_SEMITONES: Readonly<Record<string, number>> = {
    '1': 0,
    b2: 1,
    '2': 2,
    b3: 3,
    '3': 4,
    '4': 5,
    '#4': 6,
    '5': 7,
    b6: 8,
    '6': 9,
    b7: 10,
    '7': 11,
};

/**
 * Build a level from degree notation. The id is derived from the semitone set
 * (unique per level and stable across reorderings), the display name keeps the
 * human-readable degree notation.
 */
function level(degrees: string): Level {
    const intervals = degrees.split(' ').map((token) => {
        const semitones = DEGREE_SEMITONES[token];
        if (semitones === undefined) {
            throw new RangeError(`Unknown scale degree "${token}" in level "${degrees}"`);
        }
        return semitones;
    });
    return { id: `lvl-${intervals.join('-')}`, name: degrees, intervals };
}

export const LEVEL_GROUPS: readonly LevelGroup[] = [
    {
        id: 'minor',
        name: 'Minor',
        levels: [
            level('1 b3'),
            level('1 b3 5'),
            level('1 2 b3 5'),
            level('1 2 b3 5 b6'),
            level('1 2 b3 5 b6 b7'),
            level('1 2 b3 4 5 b6 b7'),
            level('1 b2 2 b3 4 5 b6 b7'),
        ],
    },
    {
        id: 'major',
        name: 'Major',
        levels: [
            level('1 3'),
            level('1 3 5'),
            level('1 2 3 5'),
            level('1 2 3 5 6'),
            level('1 2 3 5 6 7'),
            level('1 2 3 4 5 6 7'),
            level('1 2 3 4 #4 5 6 7'),
        ],
    },
    {
        id: 'mixed',
        name: 'Minor & Major',
        levels: [
            level('1 b3 3 5'),
            level('1 b2 2 b3 3 5'),
            level('1 b2 2 b3 3 5 b6 6'),
            level('1 b2 2 b3 3 5 b6 6 b7 7'),
            level('1 b2 2 b3 3 4 #4 5 b6 6 b7 7'),
        ],
    },
] as const;

/** Flat list of every level across all families. */
export const LEVELS: readonly Level[] = LEVEL_GROUPS.flatMap((group) => group.levels);
