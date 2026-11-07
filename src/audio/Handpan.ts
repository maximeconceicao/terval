/**
 * Handpan — additive-by-partials synthesis of a single warm, smooth note.
 *
 * A handpan note is built from a few *tuned* partials (fundamental, octave,
 * octave+fifth, ...) each with its own decay. Higher partials are kept low and
 * decay faster, tiny detunes add organic shimmer, and a soft attack plus a
 * gentle low-pass keep the onset round rather than percussive. Same timbre for
 * every pitch.
 *
 * Depends only on the AudioEngine (and thus Web Audio) — never on game logic.
 */

import type { AudioEngine } from './AudioEngine';

interface Partial {
    /** Frequency multiple of the fundamental. */
    ratio: number;
    /** Relative amplitude. */
    gain: number;
    /** Decay time in seconds. */
    decay: number;
    /** Detune in cents, for shimmer. */
    detune: number;
}

/**
 * Tuned partials approximating a handpan's spectrum, voiced soft: the upper
 * partials are gentle so the tone stays mellow rather than metallic.
 */
const PARTIALS: readonly Partial[] = [
    { ratio: 1, gain: 1.0, decay: 3.8, detune: 0 },
    { ratio: 2, gain: 0.4, decay: 2.4, detune: 3 },
    { ratio: 3, gain: 0.16, decay: 1.6, detune: -4 },
    { ratio: 4, gain: 0.06, decay: 1.1, detune: 5 },
];

export interface HandpanPlayOptions {
    /** Context time to start, in seconds. Defaults to "now". */
    when?: number;
    /** Loudness, 0..1. */
    velocity?: number;
    /** Reverb send amount, 0..1. */
    wet?: number;
    /** Overall level scaler (used for soft accents). */
    level?: number;
}

export class Handpan {
    constructor(private readonly engine: AudioEngine) {}

    /** Play one note at the given fundamental frequency (Hz). */
    playNote(frequency: number, options: HandpanPlayOptions = {}): void {
        const ctx = this.engine.context;
        const start = options.when ?? ctx.currentTime;
        const velocity = options.velocity ?? 0.9;
        const level = options.level ?? 0.22;
        const wet = options.wet ?? 0.32;
        // Soft onset — rounded, never a click.
        const attack = 0.022;

        // Per-note bus: everything sums here, then through a gentle low-pass,
        // then out. The low-pass tames the highs for a smoother tone.
        const bus = ctx.createGain();
        bus.gain.value = 1;

        const tone = ctx.createBiquadFilter();
        tone.type = 'lowpass';
        tone.frequency.value = Math.min(frequency * 8, ctx.sampleRate / 2.2);
        tone.Q.value = 0.2;
        bus.connect(tone);
        const disposeRoute = this.engine.route(tone, wet);

        let maxEnd = start;

        for (const partial of PARTIALS) {
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = frequency * partial.ratio;
            osc.detune.value = partial.detune;

            const env = ctx.createGain();
            const peak = Math.max(0.0001, velocity * level * partial.gain);
            const end = start + attack + partial.decay;

            env.gain.setValueAtTime(0.0001, start);
            env.gain.linearRampToValueAtTime(peak, start + attack);
            env.gain.exponentialRampToValueAtTime(0.0001, end);

            osc.connect(env);
            env.connect(bus);
            osc.start(start);
            osc.stop(end + 0.05);

            maxEnd = Math.max(maxEnd, end);
        }

        // Release the chain shortly after the longest partial finishes.
        window.setTimeout(() => {
            bus.disconnect();
            tone.disconnect();
            disposeRoute();
        }, (maxEnd - ctx.currentTime + 0.3) * 1000);
    }
}
