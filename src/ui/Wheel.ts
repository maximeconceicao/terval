import { INTERVALS } from '../music/intervals';
import { pitchClassName } from '../music/notes';
import { el, removeAfterAnimation } from './dom';

/**
 * Wheel — the chromatic circle as DOM (spec §4).
 *
 * 12 orb "slots" positioned by angle (12 o'clock = Octave, clockwise every 30°),
 * each showing an interval name only. A central tonic label with a soft glow.
 * Visual states and animations are driven by CSS classes; selection is relayed
 * via onSelect. No audio or music logic here.
 */

/** Radius of the orb ring as a percentage of the wheel size. */
const RADIUS_PCT = 42;

export class Wheel {
    readonly el: HTMLElement;
    private readonly slots: HTMLElement[] = [];
    private readonly tonic: HTMLElement;
    private readonly tonicGlow: HTMLElement;

    /** Called with the semitone distance when an active orb is clicked. */
    onSelect?: (semitones: number) => void;

    constructor() {
        this.el = el('div', 'wheel');

        this.tonicGlow = el('div', 'tonic-glow');
        this.tonic = el('div', 'tonic');
        this.el.append(this.tonicGlow, this.tonic);

        for (const interval of INTERVALS) {
            const angle = ((-90 + interval.semitones * 30) * Math.PI) / 180;
            const x = 50 + RADIUS_PCT * Math.cos(angle);
            const y = 50 + RADIUS_PCT * Math.sin(angle);

            const slot = el('div', 'orb-slot');
            slot.style.left = `${x}%`;
            slot.style.top = `${y}%`;

            const orb = el('div', 'orb');
            orb.appendChild(el('div', 'orb-label', interval.degree));
            slot.appendChild(orb);

            slot.addEventListener('click', () => {
                if (slot.classList.contains('active')) {
                    this.onSelect?.(interval.semitones);
                }
            });

            this.el.appendChild(slot);
            this.slots.push(slot);
        }
    }

    setTonic(pitchClass: number): void {
        this.tonic.textContent = pitchClassName(pitchClass);
        this.tonic.classList.remove('visible');
        this.tonicGlow.classList.remove('visible');
        // Next frame so the transition replays on restart.
        requestAnimationFrame(() => {
            this.tonic.classList.add('visible');
            this.tonicGlow.classList.add('visible');
        });
    }

    /** Enable exactly the given intervals; disable the rest. */
    setAllowed(allowed: readonly number[]): void {
        const set = new Set(allowed);
        this.slots.forEach((slot, semitones) => {
            slot.classList.toggle('active', set.has(semitones));
        });
    }

    /** Staggered reveal of the orbs (spec §9.1). */
    appear(): void {
        this.slots.forEach((slot, i) => {
            slot.classList.remove('revealed');
            slot.style.transitionDelay = `${i * 45}ms`;
            // Clear the stagger delay once revealed, so later transitions
            // (e.g. the hover scale) aren't held back by it.
            slot.addEventListener(
                'transitionend',
                () => {
                    slot.style.transitionDelay = '';
                },
                { once: true },
            );
            requestAnimationFrame(() => slot.classList.add('revealed'));
        });
    }

    /** Luminous pulse when a note is played. */
    pulse(semitones: number): void {
        this.spawnRing(semitones, 'pulse', 600);
    }

    /** Correct-answer celebration: warm ring + particle burst. */
    celebrate(semitones: number): void {
        this.spawnRing(semitones, 'celebrate', 800);
        const slot = this.slots[semitones];
        if (!slot) {
            return;
        }
        for (let i = 0; i < 10; i++) {
            const angle = (Math.PI * 2 * i) / 10;
            const dist = 42 + (i % 3) * 14;
            const p = el('div', 'particle');
            p.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
            p.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);
            slot.appendChild(p);
            removeAfterAnimation(p, 900);
        }
    }

    /** Mark a wrong answer at the given position (desaturated red cue). */
    markWrong(semitones: number): void {
        this.spawnRing(semitones, 'wrong', 800);
        this.flash(semitones, 'show-wrong', 1100);
    }

    /** Reveal the correct position after a wrong answer. */
    revealCorrect(semitones: number): void {
        this.spawnRing(semitones, 'reveal', 1200);
        this.flash(semitones, 'show-correct', 1300);
    }

    private flash(semitones: number, className: string, ms: number): void {
        const slot = this.slots[semitones];
        if (!slot) {
            return;
        }
        slot.classList.add(className);
        window.setTimeout(() => slot.classList.remove(className), ms);
    }

    private spawnRing(
        semitones: number,
        variant: 'pulse' | 'celebrate' | 'wrong' | 'reveal',
        fallbackMs: number,
    ): void {
        const slot = this.slots[semitones];
        if (!slot) {
            return;
        }
        const ring = el('div', `ring ${variant}`);
        slot.appendChild(ring);
        removeAfterAnimation(ring, fallbackMs);
    }
}
