/**
 * Audio Lab — manual bench for auditioning the audio engine (Step 2 milestone).
 *
 * Not part of the game build; served by Vite at /audio-lab.html during dev.
 * Wires the real music-engine to the AudioEngine / Handpan / Drone so the
 * handpan timbre and drone can be judged in a realistic context before any
 * visual work.
 */

import { AudioEngine } from './audio/AudioEngine';
import { Handpan } from './audio/Handpan';
import { Drone } from './audio/Drone';
import {
    createRoundSetup,
    noteFrequencyForInterval,
    droneFrequency,
    type RoundSetup,
} from './music/music-engine';
import { INTERVALS } from './music/intervals';
import { pitchClassName } from './music/notes';

const engine = new AudioEngine({ volume: 0.8 });
const handpan = new Handpan(engine);
const drone = new Drone(engine);

let setup: RoundSetup = createRoundSetup();

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const startBtn = $<HTMLButtonElement>('start');
const newRoundBtn = $<HTMLButtonElement>('newRound');
const droneBtn = $<HTMLButtonElement>('drone');
const tonicName = $<HTMLSpanElement>('tonicName');
const roundMeta = $<HTMLSpanElement>('roundMeta');
const intervalsEl = $<HTMLDivElement>('intervals');
const volume = $<HTMLInputElement>('volume');
const mute = $<HTMLInputElement>('mute');

function renderRound(): void {
    tonicName.textContent = pitchClassName(setup.tonicPc);
    roundMeta.textContent = `· drone octave ${setup.droneOctave} (${droneFrequency(setup).toFixed(1)} Hz)`;
    droneBtn.textContent = `Drone: ${drone.isRunning ? 'on' : 'off'}`;
}

function buildIntervalButtons(): void {
    intervalsEl.innerHTML = '';
    for (const interval of INTERVALS) {
        const btn = document.createElement('button');
        btn.disabled = true;
        btn.dataset.semitones = String(interval.semitones);
        btn.innerHTML = `${interval.short}<span>${interval.name}</span>`;
        btn.addEventListener('click', () => {
            handpan.playNote(noteFrequencyForInterval(setup, interval.semitones));
        });
        intervalsEl.appendChild(btn);
    }
}

function setControlsEnabled(enabled: boolean): void {
    newRoundBtn.disabled = !enabled;
    droneBtn.disabled = !enabled;
    intervalsEl.querySelectorAll('button').forEach((b) => ((b as HTMLButtonElement).disabled = !enabled));
}

startBtn.addEventListener('click', async () => {
    await engine.resume();
    startBtn.disabled = true;
    startBtn.textContent = '✔ Audio ready';
    setControlsEnabled(true);
    drone.start(droneFrequency(setup));
    renderRound();
});

newRoundBtn.addEventListener('click', () => {
    setup = createRoundSetup();
    drone.start(droneFrequency(setup));
    renderRound();
});

droneBtn.addEventListener('click', () => {
    if (drone.isRunning) {
        drone.stop();
    } else {
        drone.start(droneFrequency(setup));
    }
    renderRound();
});

volume.addEventListener('input', () => engine.setVolume(Number(volume.value)));
mute.addEventListener('change', () => engine.setMuted(mute.checked));

buildIntervalButtons();
renderRound();
