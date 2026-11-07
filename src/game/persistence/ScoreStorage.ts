/**
 * ScoreStorage — personal bests and mastery, persisted in LocalStorage.
 *
 * One record per selection (mode + id): the best score reached and whether the
 * level/scale has been mastered (score == MAX_SCORE). The backend is injectable
 * so the logic is unit-testable without a DOM, and so a missing LocalStorage
 * (tests, SSR) degrades to an in-memory store instead of throwing.
 */

import { MAX_SCORE } from '../core/GameController';
import type { GameMode } from '../core/types';

export interface ScoreRecord {
    /** Highest score ever reached, 0..MAX_SCORE. */
    best: number;
    /** True once MAX_SCORE has been reached at least once. */
    mastered: boolean;
}

/** Minimal subset of the Web Storage API that this module needs. */
export interface KeyValueStore {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
}

const PREFIX = 'terval:score:';
const EMPTY: ScoreRecord = { best: 0, mastered: false };

function memoryStore(): KeyValueStore {
    const map = new Map<string, string>();
    return {
        getItem: (key) => map.get(key) ?? null,
        setItem: (key, value) => {
            map.set(key, value);
        },
    };
}

/**
 * Prefer real localStorage, but degrade to an in-memory store when it is
 * unavailable or blocked. Even reading the `localStorage` property can throw a
 * SecurityError (Safari "block all cookies", sandboxed iframe), so the probe is
 * fully guarded.
 */
function defaultStore(): KeyValueStore {
    try {
        if (typeof localStorage !== 'undefined') {
            const probe = '__terval_probe__';
            localStorage.setItem(probe, probe);
            localStorage.removeItem(probe);
            return localStorage;
        }
    } catch {
        // Blocked or full — fall back to in-memory.
    }
    return memoryStore();
}

export class ScoreStorage {
    constructor(private readonly store: KeyValueStore = defaultStore()) {}

    private key(mode: GameMode, id: string): string {
        return `${PREFIX}${mode}:${id}`;
    }

    /** Read the record for a selection (defaults to an empty record). */
    get(mode: GameMode, id: string): ScoreRecord {
        let raw: string | null = null;
        try {
            raw = this.store.getItem(this.key(mode, id));
        } catch {
            return { ...EMPTY };
        }
        if (!raw) {
            return { ...EMPTY };
        }
        try {
            const parsed = JSON.parse(raw) as Partial<ScoreRecord>;
            const best =
                typeof parsed.best === 'number' && parsed.best >= 0 ? Math.floor(parsed.best) : 0;
            return { best, mastered: parsed.mastered === true || best >= MAX_SCORE };
        } catch {
            return { ...EMPTY };
        }
    }

    /**
     * Record a finished game's score. Keeps the best of old/new and sets mastery
     * if MAX_SCORE was reached. Returns the updated record and whether it beat
     * the previous best.
     */
    record(mode: GameMode, id: string, score: number): { record: ScoreRecord; isNewBest: boolean } {
        const current = this.get(mode, id);
        const clamped = Math.max(0, Math.floor(score));
        const isNewBest = clamped > current.best;
        const best = Math.max(current.best, clamped);
        const record: ScoreRecord = { best, mastered: current.mastered || best >= MAX_SCORE };
        try {
            this.store.setItem(this.key(mode, id), JSON.stringify(record));
        } catch {
            // Storage full or blocked — keep playing without persistence.
        }
        return { record, isNewBest };
    }
}
