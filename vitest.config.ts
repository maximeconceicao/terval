import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        // Music/game-core logic is pure TS — no DOM needed.
        environment: 'node',
        include: ['src/**/*.test.ts'],
    },
});
