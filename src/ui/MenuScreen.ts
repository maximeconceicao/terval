import { LEVEL_GROUPS, type Level } from '../game/config/levels';
import { SCALES, allowedIntervalsForScale } from '../music/scales';
import { MAX_SCORE } from '../game/core/GameController';
import type { GameSelection } from '../game/core/types';
import type { ScoreStorage } from '../game/persistence/ScoreStorage';
import { el } from './dom';

/**
 * MenuScreen — mode and level/scale selection (spec §10), with personal bests
 * and mastery badges read from ScoreStorage.
 *
 * Interval Training is organised into three families (Minor / Major /
 * Minor & Major), each a responsive grid of degree-notation cards. The
 * whole menu scrolls on short screens so it works on both desktop and mobile.
 */
export class MenuScreen {
    readonly el: HTMLElement;

    constructor(
        private readonly scores: ScoreStorage,
        private readonly onSelect: (selection: GameSelection) => void,
    ) {
        this.el = el('div', 'screen menu');

        const inner = el('div', 'menu-inner');

        inner.appendChild(el('h1', 'menu-title', 'Terval'));
        inner.appendChild(el('p', 'menu-subtitle', 'Ear training'));

        // ---- Interval Training ----
        const training = this.section('Interval Training');
        for (const group of LEVEL_GROUPS) {
            const family = el('div', 'level-family');
            family.appendChild(el('h3', 'family-title', group.name));

            const grid = el('div', 'level-grid');
            for (const level of group.levels) {
                grid.appendChild(
                    this.levelCard(group.name, level, {
                        mode: 'interval',
                        id: level.id,
                        name: `${group.name} · ${level.name}`,
                        intervals: level.intervals,
                    }),
                );
            }
            family.appendChild(grid);
            training.appendChild(family);
        }
        inner.appendChild(training);

        // ---- Scales & Modes ----
        const scales = this.section('Scales & Modes');
        const scaleGrid = el('div', 'level-grid scales');
        for (const scale of SCALES) {
            scaleGrid.appendChild(
                this.scaleCard(scale.name, {
                    mode: 'scale',
                    id: scale.id,
                    name: scale.name,
                    intervals: allowedIntervalsForScale(scale),
                }),
            );
        }
        scales.appendChild(scaleGrid);
        inner.appendChild(scales);

        this.el.appendChild(inner);
    }

    private section(title: string): HTMLElement {
        const section = el('section', 'menu-section');
        section.appendChild(el('h2', 'section-title', title));
        return section;
    }

    /** A level card showing its degree notation as individual degree pills. */
    private levelCard(family: string, level: Level, selection: GameSelection): HTMLElement {
        const btn = el('button', 'card level-card');
        btn.setAttribute('aria-label', `${family}, degrees ${level.name}`);

        const degrees = el('div', 'degrees');
        for (const token of level.name.split(' ')) {
            const accidental = token.length > 1; // b2, #4, b3…
            degrees.appendChild(el('span', `deg${accidental ? ' accidental' : ''}`, token));
        }
        btn.appendChild(degrees);

        this.attachBadge(btn, selection);
        btn.addEventListener('click', () => this.onSelect(selection));
        return btn;
    }

    /** A scale card showing the scale name. */
    private scaleCard(label: string, selection: GameSelection): HTMLElement {
        const btn = el('button', 'card scale-card');
        btn.appendChild(el('span', 'scale-name', label));
        this.attachBadge(btn, selection);
        btn.addEventListener('click', () => this.onSelect(selection));
        return btn;
    }

    private attachBadge(btn: HTMLElement, selection: GameSelection): void {
        const record = this.scores.get(selection.mode, selection.id);
        if (record.best > 0 || record.mastered) {
            btn.classList.add('has-badge');
            if (record.mastered) {
                btn.classList.add('mastered');
            }
            btn.appendChild(
                el(
                    'span',
                    `badge${record.mastered ? ' mastered' : ''}`,
                    record.mastered ? '✦ mastered' : `${record.best} / ${MAX_SCORE}`,
                ),
            );
        }
    }
}
