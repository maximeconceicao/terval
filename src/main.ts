import './ui/styles.css';
import { App } from './ui/App';

document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('game-container') ?? document.body;
    new App(root).start();
});
