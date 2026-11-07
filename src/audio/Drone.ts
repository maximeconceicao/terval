/**
 * Drone — a continuous, warm, well-defined low tone for a whole game.
 *
 * Additive sine layers: a strong fundamental, an octave and a twelfth to make
 * the pitch clearly audible, a modest sub for body, and a subtly detuned twin
 * for an organic beat. Low-passed for warmth (but open enough to keep the pitch
 * present), with a slow LFO on the level for a gentle "breathing" feel. Fades
 * in/out to avoid clicks.
 */

import type { AudioEngine } from './AudioEngine';

interface DroneLayer {
    oscillator: OscillatorNode;
}

export interface DroneOptions {
    /** Peak level of the drone, 0..1. */
    level?: number;
    /** Fade-in time in seconds. */
    fadeIn?: number;
    /** Reverb send amount. */
    wet?: number;
}

export class Drone {
    private layers: DroneLayer[] = [];
    private outGain: GainNode | null = null;
    private lfo: OscillatorNode | null = null;
    private disposeRoute: (() => void) | null = null;
    private running = false;
    private level = 0.16;

    constructor(private readonly engine: AudioEngine) {}

    get isRunning(): boolean {
        return this.running;
    }

    /** Start the drone on the given fundamental frequency (Hz). */
    start(frequency: number, options: DroneOptions = {}): void {
        if (this.running) {
            this.stop(0.05);
        }
        const ctx = this.engine.context;
        const start = ctx.currentTime;
        this.level = options.level ?? 0.16;
        const fadeIn = options.fadeIn ?? 1.5;

        const out = ctx.createGain();
        out.gain.setValueAtTime(0.0001, start);
        out.gain.exponentialRampToValueAtTime(this.level, start + fadeIn);

        // Warmth, but open enough that the harmonics (and thus the pitch) come
        // through — a muffled drone reads as vague.
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = Math.max(400, frequency * 7);
        filter.Q.value = 0.3;
        filter.connect(out);

        this.disposeRoute = this.engine.route(out, options.wet ?? 0.25);
        this.outGain = out;

        // Layers chosen so the fundamental pitch is unmistakable.
        this.addLayer(frequency, 0, 0.7, filter); // fundamental
        this.addLayer(frequency, 7, 0.18, filter); // +7 cents -> slow beating
        this.addLayer(frequency * 2, 0, 0.3, filter); // octave -> pitch clarity
        this.addLayer(frequency * 3, 0, 0.12, filter); // twelfth -> presence
        this.addLayer(frequency / 2, 0, 0.3, filter); // sub -> body

        // Breathing: slow LFO modulating the output level around its base.
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 0.12;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = this.level * 0.14;
        lfo.connect(lfoGain);
        lfoGain.connect(out.gain);
        lfo.start(start);
        this.lfo = lfo;

        this.running = true;
    }

    private addLayer(frequency: number, detune: number, gain: number, destination: AudioNode): void {
        const ctx = this.engine.context;
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = frequency;
        osc.detune.value = detune;

        const g = ctx.createGain();
        g.gain.value = gain;

        osc.connect(g);
        g.connect(destination);
        osc.start();

        this.layers.push({ oscillator: osc });
    }

    /** Fade out and tear down the drone. */
    stop(fadeOut = 0.8): void {
        if (!this.running || !this.outGain) {
            return;
        }
        const ctx = this.engine.context;
        const t = ctx.currentTime;
        const out = this.outGain;
        const layers = this.layers;
        const lfo = this.lfo;

        out.gain.cancelScheduledValues(t);
        out.gain.setValueAtTime(Math.max(out.gain.value, 0.0001), t);
        out.gain.exponentialRampToValueAtTime(0.0001, t + fadeOut);

        const stopAt = t + fadeOut + 0.05;
        for (const layer of layers) {
            layer.oscillator.stop(stopAt);
        }
        lfo?.stop(stopAt);
        const disposeRoute = this.disposeRoute;
        window.setTimeout(() => {
            out.disconnect();
            disposeRoute?.();
        }, (fadeOut + 0.2) * 1000);

        this.layers = [];
        this.outGain = null;
        this.lfo = null;
        this.disposeRoute = null;
        this.running = false;
    }
}
