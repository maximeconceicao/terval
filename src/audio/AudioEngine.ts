/**
 * AudioEngine — owns the single AudioContext and the shared output chain.
 *
 * Responsibilities:
 * - Lazily create / resume the AudioContext after a user gesture (autoplay policy).
 * - Expose a master gain (volume + mute) feeding the destination.
 * - Provide a shared convolution reverb bus, with a procedurally generated
 *   impulse response (no external asset, no licensing concern).
 * - Offer `route()` so instruments send a dry signal to the master and a wet
 *   signal to the reverb without re-wiring the chain each time.
 *
 * This module has no knowledge of musical logic or Phaser.
 */

export interface AudioEngineOptions {
    /** Initial master volume, 0..1. */
    volume?: number;
    /** Reverb tail length in seconds. */
    reverbSeconds?: number;
    /** Reverb wet level at the convolver output, 0..1. */
    reverbLevel?: number;
}

export class AudioEngine {
    private ctx: AudioContext | null = null;
    private master!: GainNode;
    private convolver!: ConvolverNode;
    private reverbReturn!: GainNode;

    private _volume: number;
    private _muted = false;
    private wantSuspended = false;
    private readonly reverbSeconds: number;
    private readonly reverbLevel: number;

    constructor(options: AudioEngineOptions = {}) {
        this._volume = options.volume ?? 0.8;
        this.reverbSeconds = options.reverbSeconds ?? 2.6;
        this.reverbLevel = options.reverbLevel ?? 0.9;
    }

    /** True once the context exists and is running. */
    get ready(): boolean {
        return this.ctx !== null && this.ctx.state === 'running';
    }

    /** The AudioContext. Throws if the engine has not been resumed yet. */
    get context(): AudioContext {
        if (!this.ctx) {
            throw new Error('AudioEngine not started — call resume() from a user gesture first.');
        }
        return this.ctx;
    }

    /** Current context time, or 0 if not started. */
    now(): number {
        return this.ctx ? this.ctx.currentTime : 0;
    }

    /**
     * Create the context on first call (must be triggered by a user gesture),
     * then resume it. Safe to call repeatedly.
     */
    async resume(fadeIn = 0): Promise<void> {
        this.wantSuspended = false;
        if (!this.ctx) {
            this.ctx = new AudioContext();
            this.buildGraph();
        }
        if (this.ctx.state !== 'running') {
            await this.ctx.resume();
        }
        if (fadeIn > 0) {
            // Exponential (linear-in-dB) fade back in, mirroring suspend().
            const g = this.master.gain;
            const t = this.ctx.currentTime;
            g.cancelScheduledValues(t);
            g.setValueAtTime(Math.max(g.value, 0.0001), t);
            g.exponentialRampToValueAtTime(Math.max(this.targetGain(), 0.0001), t + fadeIn);
        } else {
            this.applyGain();
        }
    }

    /**
     * Fade the master out over `fade` seconds, then suspend the audio clock
     * (e.g. on pause) — no abrupt cut. If resume() is called during the fade,
     * the pending suspend is cancelled.
     */
    async suspend(fade = 0.7): Promise<void> {
        if (!this.ctx || this.ctx.state !== 'running') {
            return;
        }
        this.wantSuspended = true;

        const g = this.master.gain;
        const t = this.ctx.currentTime;
        g.cancelScheduledValues(t);
        // Exponential (linear-in-dB) ramp so the fade sounds gradual to the ear;
        // a linear ramp stays loud then drops fast at the end, reading as a cut.
        g.setValueAtTime(Math.max(g.value, 0.0001), t);
        g.exponentialRampToValueAtTime(0.0001, t + fade);

        await new Promise((resolve) => window.setTimeout(resolve, fade * 1000 + 30));

        if (this.wantSuspended && this.ctx.state === 'running') {
            await this.ctx.suspend();
        }
    }

    private buildGraph(): void {
        const ctx = this.ctx!;

        this.master = ctx.createGain();
        this.master.connect(ctx.destination);

        this.convolver = ctx.createConvolver();
        this.convolver.buffer = this.createImpulseResponse(this.reverbSeconds);

        this.reverbReturn = ctx.createGain();
        this.reverbReturn.gain.value = this.reverbLevel;

        this.convolver.connect(this.reverbReturn);
        this.reverbReturn.connect(this.master);
    }

    /**
     * Route an instrument source to the output: dry to the master, and an
     * optional wet copy to the reverb bus. Returns a disposer the caller must
     * invoke on cleanup so the reverb-send node doesn't linger connected to the
     * (session-lived) convolver.
     */
    route(source: AudioNode, wet = 0.3): () => void {
        source.connect(this.master);
        if (wet <= 0) {
            return () => {};
        }
        const send = this.context.createGain();
        send.gain.value = wet;
        source.connect(send);
        send.connect(this.convolver);
        return () => {
            try {
                send.disconnect();
            } catch {
                // already disconnected
            }
        };
    }

    setVolume(volume: number): void {
        this._volume = Math.max(0, Math.min(1, volume));
        this.applyGain();
    }

    get volume(): number {
        return this._volume;
    }

    setMuted(muted: boolean): void {
        this._muted = muted;
        this.applyGain();
    }

    toggleMuted(): boolean {
        this.setMuted(!this._muted);
        return this._muted;
    }

    get muted(): boolean {
        return this._muted;
    }

    private targetGain(): number {
        return this._muted ? 0 : this._volume;
    }

    private applyGain(): void {
        if (!this.ctx) {
            return;
        }
        // Short ramp avoids clicks when muting / changing volume.
        const g = this.master.gain;
        const t = this.ctx.currentTime;
        g.cancelScheduledValues(t);
        g.setValueAtTime(Math.max(g.value, 0.0001), t);
        g.linearRampToValueAtTime(this.targetGain(), t + 0.03);
    }

    /**
     * Generate a smooth, slightly dark reverb impulse response: stereo noise
     * with an exponential decay. Cheap and fully synthetic.
     */
    private createImpulseResponse(seconds: number): AudioBuffer {
        const ctx = this.ctx!;
        const rate = ctx.sampleRate;
        const length = Math.max(1, Math.floor(seconds * rate));
        const buffer = ctx.createBuffer(2, length, rate);

        for (let channel = 0; channel < 2; channel++) {
            const data = buffer.getChannelData(channel);
            let last = 0;
            for (let i = 0; i < length; i++) {
                const decay = Math.pow(1 - i / length, 2.4);
                // White noise, lightly low-passed (one-pole) to soften the tail.
                const white = Math.random() * 2 - 1;
                last = last * 0.55 + white * 0.45;
                data[i] = last * decay;
            }
        }
        return buffer;
    }
}
