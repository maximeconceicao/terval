import { Wheel } from './Wheel';
import { el } from './dom';
import type { AudioEngine } from '../audio/AudioEngine';
import { Handpan } from '../audio/Handpan';
import { Drone } from '../audio/Drone';
import { GameController, TOTAL_ROUNDS } from '../game/core/GameController';
import { noteFrequencyForInterval } from '../music/music-engine';
import type { GameSelection } from '../game/core/types';
import type { ScoreStorage } from '../game/persistence/ScoreStorage';

/**
 * GameScreen — the recognition loop as DOM (spec §3, revised rules).
 *
 * A game is a fixed run of TOTAL_ROUNDS notes. A wrong answer is shown (the
 * clicked orb flashes, the correct one is revealed) but does NOT end the game —
 * play continues to the last note; the score is the number of correct answers.
 * A single tonic/drone is kept for the whole game. Feedback is visual only. A
 * replay button re-plays the current mystery note. Pausable (icon + Escape).
 */

const CORRECT_TRANSITION_MS = 950;
const WRONG_TRANSITION_MS = 1700;

// Opening ritual: the drone alone, then the round's intervals previewed
// clockwise, then the first mystery note.
const DRONE_SOLO_MS = 1200;
const PREVIEW_STEP_MS = 420;
const PREVIEW_TO_QUESTION_MS = 700;

export class GameScreen {
    readonly el: HTMLElement;

    private readonly handpan: Handpan;
    private readonly drone: Drone;
    private readonly controller = new GameController();
    private readonly wheel = new Wheel();
    private readonly scoreEl: HTMLElement;
    private readonly replayBtn: HTMLButtonElement;

    private endOverlay?: HTMLElement;
    private pauseOverlay?: HTMLElement;
    private timers: number[] = [];
    private readonly onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            this.togglePause();
        }
    };

    private inputLocked = true;
    private started = false;
    private ended = false;
    private paused = false;
    private intro = false;
    private pendingQuestion = false;
    private answerPhase = false;

    constructor(
        private readonly selection: GameSelection,
        private readonly audio: AudioEngine,
        private readonly scores: ScoreStorage,
        private readonly onExit: () => void,
    ) {
        this.handpan = new Handpan(audio);
        this.drone = new Drone(audio);

        this.el = el('div', 'screen game');

        // Top-right controls: volume, pause.
        const controls = el('div', 'controls');

        const volume = document.createElement('input');
        volume.type = 'range';
        volume.min = '0';
        volume.max = '1';
        volume.step = '0.01';
        volume.value = String(audio.volume);
        volume.className = 'volume';
        volume.setAttribute('aria-label', 'Volume');
        volume.addEventListener('input', () => audio.setVolume(Number(volume.value)));

        const pauseBtn = el('button', 'icon-btn pause-icon');
        pauseBtn.setAttribute('aria-label', 'Pause');
        pauseBtn.addEventListener('click', () => this.togglePause());

        controls.append(volume, pauseBtn);

        const hud = el('div', 'hud');
        hud.appendChild(el('div', 'level', this.selection.name));
        this.scoreEl = el('div', 'score');
        hud.appendChild(this.scoreEl);

        this.wheel.onSelect = (semitones) => this.onSelect(semitones);

        // Replay control, centred below the wheel and labelled so it is clearly
        // "replay the note", not "restart the game".
        this.replayBtn = el('button', 'replay') as HTMLButtonElement;
        this.replayBtn.setAttribute('aria-label', 'Replay the note');
        this.replayBtn.disabled = true;
        this.replayBtn.append(el('span', 'replay-icon', '↺'), el('span', undefined, 'Replay'));
        this.replayBtn.addEventListener('click', () => this.replayNote());

        // The wheel and the replay button are laid out directly by the game
        // grid (see styles.css): the wheel stays centred, the replay button
        // sits midway between the wheel and the bottom of the screen.
        this.el.append(controls, hud, this.wheel.el, this.replayBtn);

        const prompt = el('div', 'prompt', 'Click to start');
        let starting = false;
        prompt.addEventListener('click', async () => {
            if (starting || this.started) {
                return;
            }
            starting = true;
            try {
                await this.audio.resume();
            } catch {
                starting = false;
                return;
            }
            prompt.remove();
            this.started = true;
            this.scoreEl.classList.add('visible');
            this.beginRound();
        });
        this.el.appendChild(prompt);
    }

    mount(): void {
        window.addEventListener('keydown', this.onKey);
    }

    /** Stop audio, timers and listeners when leaving this screen. */
    dispose(): void {
        this.clearTimers();
        this.drone.stop(0.3);
        window.removeEventListener('keydown', this.onKey);
    }

    private beginRound(): void {
        this.clearEndOverlay();
        this.clearPauseOverlay();
        this.clearTimers();
        this.ended = false;
        this.paused = false;
        this.pendingQuestion = false;
        this.answerPhase = false;

        this.audio.resume();
        this.controller.start(this.selection.intervals);
        this.drone.start(this.controller.droneFrequency);
        this.wheel.setTonic(this.controller.setup.tonicPc);
        this.wheel.setAllowed(this.controller.allowed);
        this.wheel.appear();
        this.updateHud();
        this.updateReplay();

        this.playIntro();
    }

    /**
     * Opening ritual: let the drone settle, preview the round's intervals
     * clockwise (ascending semitone), then present the first mystery note.
     * Not interruptible (pause is blocked) — it is short.
     */
    private playIntro(): void {
        this.intro = true;
        this.inputLocked = true;
        this.answerPhase = false;
        this.updateReplay();

        const intervals = [...this.controller.allowed].sort((a, b) => a - b);
        intervals.forEach((semitones, i) => {
            this.after(DRONE_SOLO_MS + i * PREVIEW_STEP_MS, () => {
                this.handpan.playNote(noteFrequencyForInterval(this.controller.setup, semitones), {
                    velocity: 0.8,
                });
                this.wheel.pulse(semitones);
            });
        });

        const total = DRONE_SOLO_MS + intervals.length * PREVIEW_STEP_MS + PREVIEW_TO_QUESTION_MS;
        this.after(total, () => {
            this.intro = false;
            this.fireQuestion();
        });
    }

    private updateHud(): void {
        this.scoreEl.textContent = `Score ${this.controller.score}   ·   Note ${this.controller.round} / ${TOTAL_ROUNDS}`;
    }

    private scheduleQuestion(delay: number): void {
        this.answerPhase = false;
        this.inputLocked = true;
        this.updateReplay();
        this.after(delay, () => this.fireQuestion());
    }

    private fireQuestion(): void {
        if (this.paused) {
            this.pendingQuestion = true;
            return;
        }
        this.pendingQuestion = false;

        this.inputLocked = false;
        this.answerPhase = true;
        this.updateReplay();
        this.handpan.playNote(this.controller.questionFrequency, { velocity: 0.95 });
    }

    private replayNote(): void {
        if (!this.answerPhase || this.paused || this.ended) {
            return;
        }
        this.handpan.playNote(this.controller.questionFrequency, { velocity: 0.95 });
    }

    private onSelect(selected: number): void {
        if (this.inputLocked || this.paused || this.controller.status !== 'awaiting') {
            return;
        }
        this.answerPhase = false;
        this.updateReplay();

        // The click always plays the selected note immediately (spec §3.4).
        this.handpan.playNote(noteFrequencyForInterval(this.controller.setup, selected));
        this.wheel.pulse(selected);

        const result = this.controller.submit(selected);
        this.updateHud();

        if (result.correct) {
            this.wheel.celebrate(selected);
        } else {
            // Show the miss, then reveal the correct position (spec request).
            this.wheel.markWrong(selected);
            this.wheel.revealCorrect(result.expected);
        }

        if (result.status === 'finished') {
            this.onFinish();
        } else {
            this.scheduleQuestion(result.correct ? CORRECT_TRANSITION_MS : WRONG_TRANSITION_MS);
        }
    }

    private onFinish(): void {
        this.ended = true;
        this.inputLocked = true;
        this.answerPhase = false;
        this.updateReplay();
        this.drone.stop(1.5);

        const score = this.controller.score;
        const mastered = score >= TOTAL_ROUNDS;
        const { record, isNewBest } = this.scores.record(this.selection.mode, this.selection.id, score);

        const lines: { text: string; record?: boolean }[] = [{ text: `Score: ${score} / ${TOTAL_ROUNDS}` }];
        if (mastered) {
            lines.push({ text: '✦ level mastered', record: true });
        } else if (isNewBest) {
            lines.push({ text: 'New best!', record: true });
        } else {
            lines.push({
                text: `Best: ${record.best} / ${TOTAL_ROUNDS}${record.mastered ? '   ·   ✦ mastered' : ''}`,
            });
        }

        this.after(900, () => this.showEndOverlay(mastered ? 'Perfect!' : 'Game over', lines));
    }

    // ---- Pause ----

    private togglePause(): void {
        if (this.paused) {
            this.resumeGame();
        } else {
            this.pauseGame();
        }
    }

    private pauseGame(): void {
        if (!this.started || this.ended || this.paused || this.intro) {
            return;
        }
        this.paused = true;
        this.inputLocked = true;
        this.audio.suspend();
        this.updateReplay();
        this.showPauseOverlay();
    }

    private resumeGame(): void {
        if (!this.paused) {
            return;
        }
        this.paused = false;
        this.clearPauseOverlay();
        this.audio.resume(0.6);

        if (this.pendingQuestion) {
            this.pendingQuestion = false;
            this.fireQuestion();
        } else if (this.answerPhase) {
            this.inputLocked = false;
        }
        this.updateReplay();
    }

    private updateReplay(): void {
        this.replayBtn.disabled = !(this.answerPhase && !this.paused && !this.ended);
    }

    // ---- Overlays ----

    private showEndOverlay(title: string, lines: { text: string; record?: boolean }[]): void {
        this.endOverlay = this.buildOverlay(title, lines, [
            { label: 'Play again', action: () => this.beginRound() },
            { label: 'Menu', action: () => this.exit() },
        ]);
    }

    private showPauseOverlay(): void {
        this.pauseOverlay = this.buildOverlay('Pause', [], [
            { label: 'Resume', action: () => this.resumeGame() },
            { label: 'Restart', action: () => this.beginRound() },
            { label: 'Menu', action: () => this.exit() },
        ], 'stacked');
    }

    private buildOverlay(
        title: string,
        lines: { text: string; record?: boolean }[],
        buttons: { label: string; action: () => void }[],
        modifier?: string,
    ): HTMLElement {
        const overlay = el('div', `overlay${modifier ? ` ${modifier}` : ''}`);
        overlay.appendChild(el('div', 'title', title));
        for (const line of lines) {
            overlay.appendChild(el('div', `line${line.record ? ' record' : ''}`, line.text));
        }
        const actions = el('div', 'actions');
        for (const b of buttons) {
            const btn = el('button', 'btn', b.label);
            btn.addEventListener('click', b.action);
            actions.appendChild(btn);
        }
        overlay.appendChild(actions);
        this.el.appendChild(overlay);
        return overlay;
    }

    private exit(): void {
        this.dispose();
        this.onExit();
    }

    private clearEndOverlay(): void {
        this.endOverlay?.remove();
        this.endOverlay = undefined;
    }

    private clearPauseOverlay(): void {
        this.pauseOverlay?.remove();
        this.pauseOverlay = undefined;
    }

    // ---- Timers ----

    private after(ms: number, fn: () => void): void {
        this.timers.push(window.setTimeout(fn, ms));
    }

    private clearTimers(): void {
        for (const id of this.timers) {
            window.clearTimeout(id);
        }
        this.timers = [];
    }
}
