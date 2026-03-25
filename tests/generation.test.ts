import { describe, it, expect } from 'vitest';
import { Puzzle } from '../src/puzzle';
import { MIN_SIZE, MAX_SIZE } from '../src/constants';

describe('Random puzzle generation', () => {
    it('generates 100 solvable puzzles with random dimensions', { timeout: 30_000 }, () => {
        const totalPuzzles = 100;

        for (let i = 0; i < totalPuzzles; i++) {
            const width = MIN_SIZE + Math.floor(Math.random() * (MAX_SIZE - MIN_SIZE + 1));
            const height = MIN_SIZE + Math.floor(Math.random() * (MAX_SIZE - MIN_SIZE + 1));
            const puzzle = new Puzzle(width, height);
            expect(puzzle.isSolvable()).toBe(true);
        }
    });
});
