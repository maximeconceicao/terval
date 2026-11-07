import { AudioEngine } from '../audio/AudioEngine';
import { ScoreStorage } from '../game/persistence/ScoreStorage';
import { MenuScreen } from './MenuScreen';
import { GameScreen } from './GameScreen';
import type { GameSelection } from '../game/core/types';
import { el } from './dom';

/**
 * App — top-level shell and router.
 *
 * Holds the shared AudioEngine (single AudioContext across screens) and
 * ScoreStorage, paints a persistent night background, and swaps between the
 * menu and game screens.
 */
export class App {
    private readonly audio = new AudioEngine({ volume: 0.8 });
    private readonly scores = new ScoreStorage();
    private readonly mount: HTMLElement;
    private current?: { dispose?: () => void };

    constructor(root: HTMLElement) {
        const stage = el('div', 'stage');
        stage.appendChild(this.background());
        this.mount = el('div', 'screen-mount');
        stage.appendChild(this.mount);
        root.replaceChildren(stage);
    }

    start(): void {
        this.showMenu();
    }

    private background(): HTMLElement {
        const bg = el('div', 'bg');
        bg.append(el('div', 'blob b1'), el('div', 'blob b2'), el('div', 'blob b3'));
        return bg;
    }

    private showMenu(): void {
        this.current?.dispose?.();
        const menu = new MenuScreen(this.scores, (selection) => this.showGame(selection));
        this.current = {};
        this.mount.replaceChildren(menu.el);
    }

    private showGame(selection: GameSelection): void {
        this.current?.dispose?.();
        const game = new GameScreen(selection, this.audio, this.scores, () => this.showMenu());
        this.current = game;
        this.mount.replaceChildren(game.el);
        game.mount();
    }
}
