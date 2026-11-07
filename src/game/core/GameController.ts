/**
 * GameController — the game loop as a pure, framework-free state machine.
 *
 * A game is a fixed run of TOTAL_ROUNDS notes on a single tonic/drone. A wrong
 * answer no longer ends the game: it is simply counted as missed, and play
 * continues to the last note. The score is the number of correct answers.
 *
 * It never touches Phaser or Web Audio: the scene reads `questionFrequency` /
 * `droneFrequency` / `setup` to drive audio and reacts to `submit()` results to
 * drive visuals. Fully unit-testable and reusable by a future Simon mode.
 */

import {
    createRoundSetup,
    pickInterval,
    validateAnswer,
    noteFrequencyForInterval,
    droneFrequency,
    type RoundSetup,
    type Rng,
} from '../../music/music-engine';

/** Total notes played in one game. */
export const TOTAL_ROUNDS = 20;

/** Max achievable score (all correct) — also the mastery threshold. */
export const MAX_SCORE = TOTAL_ROUNDS;

export type GameStatus = 'idle' | 'awaiting' | 'finished';

export interface SubmitResult {
    correct: boolean;
    /** The interval that was expected for the round just answered. */
    expected: number;
    /** The interval the player selected. */
    selected: number;
    /** Score (correct answers) so far. */
    score: number;
    /** The round that was just answered (1..TOTAL_ROUNDS). */
    round: number;
    /** Status after this answer. */
    status: GameStatus;
}

export class GameController {
    private _setup: RoundSetup | null = null;
    private _allowed: number[] = [];
    private _score = 0;
    private _round = 0;
    private _status: GameStatus = 'idle';
    private _target = -1;
    private _previous: number | null = null;

    constructor(private readonly rng: Rng = Math.random) {}

    get status(): GameStatus {
        return this._status;
    }

    get score(): number {
        return this._score;
    }

    /** Current question number presented (1..TOTAL_ROUNDS), 0 before start. */
    get round(): number {
        return this._round;
    }

    get allowed(): readonly number[] {
        return this._allowed;
    }

    /** The current round setup. Throws if the game has not started. */
    get setup(): RoundSetup {
        if (!this._setup) {
            throw new Error('GameController: start() a game first.');
        }
        return this._setup;
    }

    /** The interval currently to identify (0..11). */
    get target(): number {
        return this._target;
    }

    /** Frequency of the drone fundamental. */
    get droneFrequency(): number {
        return droneFrequency(this.setup);
    }

    /** Frequency of the current mystery note to identify. */
    get questionFrequency(): number {
        return noteFrequencyForInterval(this.setup, this._target);
    }

    /** Start a fresh game with the given allowed intervals. */
    start(allowed: readonly number[]): void {
        if (allowed.length === 0) {
            throw new RangeError('GameController.start: no allowed intervals');
        }
        this._setup = createRoundSetup(this.rng);
        this._allowed = [...allowed];
        this._score = 0;
        this._round = 1;
        this._status = 'awaiting';
        this._previous = null;
        this._target = pickInterval(this._allowed, null, this.rng);
    }

    /**
     * Submit the player's selected interval for the current round. Counts it,
     * then either advances to the next question or finishes the game after
     * TOTAL_ROUNDS. Ignored (returns a snapshot) unless awaiting an answer.
     */
    submit(selected: number): SubmitResult {
        if (this._status !== 'awaiting') {
            return {
                correct: false,
                expected: this._target,
                selected,
                score: this._score,
                round: this._round,
                status: this._status,
            };
        }

        const expected = this._target;
        const correct = validateAnswer(expected, selected);
        if (correct) {
            this._score += 1;
        }

        const answeredRound = this._round;

        if (answeredRound >= TOTAL_ROUNDS) {
            this._status = 'finished';
        } else {
            this._round = answeredRound + 1;
            this._previous = expected;
            this._target = pickInterval(this._allowed, this._previous, this.rng);
        }

        return {
            correct,
            expected,
            selected,
            score: this._score,
            round: answeredRound,
            status: this._status,
        };
    }
}
