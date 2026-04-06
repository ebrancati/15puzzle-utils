import { describe, it, expect } from 'vitest';
import { Puzzle } from '../src/puzzle';
import { DEFAULT_SIZE, MIN_SIZE, MAX_SIZE } from '../src/constants';
import {
    InvalidDimensionError,
    InvalidGridContentError,
    InvalidPositionError,
    EmptyTileSlideError,
    BlockedPathError,
} from '../src/exceptions';

function createSolved4x4Puzzle(): Puzzle {
    return new Puzzle([
        [ 1,  2,  3,  4],
        [ 5,  6,  7,  8],
        [ 9, 10, 11, 12],
        [13, 14, 15,  0],
    ]);
}

/** Empty tile at [3][1] */
function createSolvable4x4Puzzle(): Puzzle {
    return new Puzzle([
        [ 1,  2,  3,  4],
        [ 5,  6,  7,  8],
        [ 9, 10, 11, 12],
        [13,  0, 14, 15],
    ]);
}

function createUnsolvable4x4Puzzle(): Puzzle {
    return new Puzzle([
        [ 1,  2,  3,  4],
        [ 5,  6,  7,  8],
        [ 9, 10, 11, 12],
        [13, 15, 14,  0],
    ]);
}

describe('Puzzle constructor', () => {
    it('shuffles a DEFAULT_SIZE x DEFAULT_SIZE puzzle when no args', () => {
        const puzzle = new Puzzle();
        expect(puzzle.getWidth()).toBe(DEFAULT_SIZE);
        expect(puzzle.getHeight()).toBe(DEFAULT_SIZE);
        expect(puzzle.isSolvable()).toBe(true);
        expect(puzzle.isSolved()).toBe(false);
    });

    it('accepts width and height', () => {
        const puzzle = new Puzzle(4, 4);
        expect(puzzle.getWidth()).toBe(4);
        expect(puzzle.getHeight()).toBe(4);
        expect(puzzle.isSolvable()).toBe(true);
        expect(puzzle.isSolved()).toBe(false);
    });

    it('defaults height to DEFAULT_SIZE when only width is provided', () => {
        const puzzle = new Puzzle(3);
        expect(puzzle.getWidth()).toBe(3);
        expect(puzzle.getHeight()).toBe(DEFAULT_SIZE);
        expect(puzzle.isSolvable()).toBe(true);
        expect(puzzle.isSolved()).toBe(false);
    });

    it('creates a puzzle from a 4x4 grid', () => {
        const puzzle = createSolved4x4Puzzle();
        expect(puzzle.getWidth()).toBe(4);
        expect(puzzle.getHeight()).toBe(4);
    });
});

describe('isSolved()', () => {
    it('returns true for a solved puzzle', () => {
        expect(createSolved4x4Puzzle().isSolved()).toBe(true);
    });

    it('returns false for an unsolved puzzle', () => {
        expect(new Puzzle(4, 4).isSolved()).toBe(false);
    });
});

describe('isSolvable()', () => {
    it('returns true for a randomly generated 3x5 puzzle', () => {
        expect(new Puzzle(3, 5).isSolvable()).toBe(true);
    });

    it('returns true for a randomly generated 4x5 puzzle', () => {
        expect(new Puzzle(4, 5).isSolvable()).toBe(true);
    });

    it('returns true for a randomly generated 4x6 puzzle', () => {
        expect(new Puzzle(4, 6).isSolvable()).toBe(true);
    });

    it('returns true for a known solvable puzzle', () => {
        expect(createSolvable4x4Puzzle().isSolvable()).toBe(true);
    });

    it('returns false for an unsolvable puzzle', () => {
        expect(createUnsolvable4x4Puzzle().isSolvable()).toBe(false);
    });
});

describe('canSlide()', () => {
    it('allows sliding a tile adjacent to the empty space', () => {
        const puzzle = createSolvable4x4Puzzle();
        expect(puzzle.canSlide(3, 2)).toBe(true);
    });

    it('does not allow sliding the empty space', () => {
        const puzzle = createSolvable4x4Puzzle();
        expect(puzzle.canSlide(3, 1)).toBe(false);
    });

    it('does not allow sliding a tile not in the same row/column as empty space', () => {
        const puzzle = createSolvable4x4Puzzle();
        expect(puzzle.canSlide(0, 0)).toBe(false);
    });

    it('allows sliding a tile on the same row as the empty space and not adjacent to it', () => {
        const puzzle = createSolvable4x4Puzzle();
        expect(puzzle.canSlide(3, 3)).toBe(true);
    });

    it('allows sliding a tile on the same column as the empty space and not adjacent to it', () => {
        const puzzle = createSolvable4x4Puzzle();
        expect(puzzle.canSlide(0, 1)).toBe(true);
    });
});

describe('slide()', () => {
    it('returns R when sliding a tile to the right', () => {
        const puzzle = new Puzzle([
            [1, 0],
            [2, 3]
        ]);
        expect(puzzle.slide(0, 0)).toBe('R');
    });

    it('returns L when sliding a tile to the left', () => {
        const puzzle = new Puzzle([
            [0, 1],
            [2, 3]
        ]);
        expect(puzzle.slide(0, 1)).toBe('L');
    });

    it('returns D when sliding a tile downward', () => {
        const puzzle = new Puzzle([
            [1, 2],
            [0, 3]
        ]);
        expect(puzzle.slide(0, 0)).toBe('D');
    });

    it('returns U when sliding a tile upward', () => {
        const puzzle = new Puzzle([
            [0, 2],
            [1, 3]
        ]);
        expect(puzzle.slide(1, 0)).toBe('U');
    });

    it('returns R3 when sliding 3 tiles horizontally to the right', () => {
        const puzzle = new Puzzle([
            [0, 1, 2, 3],
            [4, 5, 6, 7]
        ]);
        expect(puzzle.slide(0, 3)).toBe('R3');
    });

    it('returns L3 when sliding 3 tiles horizontally to the left', () => {
        const puzzle = new Puzzle([
            [1, 2, 3, 0],
            [4, 5, 6, 7]
        ]);
        expect(puzzle.slide(0, 0)).toBe('L3');
    });

    it('returns U3 when sliding 3 tiles vertically upward', () => {
        const puzzle = new Puzzle([
            [1, 2],
            [3, 4],
            [5, 6],
            [0, 7]
        ]);
        expect(puzzle.slide(0, 0)).toBe('U3');
    });

    it('returns D3 when sliding 3 tiles vertically downward', () => {
        const puzzle = new Puzzle([
            [0, 1],
            [2, 3],
            [4, 5],
            [6, 7]
        ]);
        expect(puzzle.slide(3, 0)).toBe('D3');
    });

    it('solves the puzzle after correct slides', () => {
        const puzzle = new Puzzle([
            [ 1,  3,  0,  4],
            [ 5,  2,  7,  8],
            [ 9,  6, 10, 11],
            [13, 14, 15, 12],
        ]);
        expect(puzzle.slide(0, 1)).toBe('R');
        expect(puzzle.slide(2, 1)).toBe('D2');
        expect(puzzle.slide(2, 3)).toBe('R2');
        expect(puzzle.slide(3, 3)).toBe('U');
        expect(puzzle.isSolved()).toBe(true);
    });
});

describe('getGrid()', () => {
    it('returns the correct grid', () => {
        const puzzle = new Puzzle([[1, 2, 3], [4, 5, 0]]);
        expect(puzzle.getGrid()).toEqual([[1, 2, 3], [4, 5, 0]]);
    });
});

describe('getWidth() and getHeight()', () => {
    it('returns correct dimensions', () => {
        const puzzle = new Puzzle(5, 3);
        expect(puzzle.getWidth()).toBe(5);
        expect(puzzle.getHeight()).toBe(3);
    });
});

describe('getValue()', () => {
    it('returns correct tile values', () => {
        const puzzle = createSolved4x4Puzzle();
        expect(puzzle.getValue(0, 0)).toBe(1);
        expect(puzzle.getValue(1, 2)).toBe(7);
        expect(puzzle.getValue(3, 3)).toBe(0);
    });
});

describe('getEmptyPosition()', () => {
    it('returns the correct empty position', () => {
        const pos = new Puzzle([
            [1, 0, 2],
            [3, 4, 5]
        ]).getEmptyPosition();
        expect(pos).toEqual({ row: 0, col: 1 });
    });
});

describe('toAsciiString()', () => {
    it('formats a 4x4 puzzle correctly', () => {
        const ascii = createSolved4x4Puzzle().toAsciiString();
        expect(ascii).toBe('1 2 3 4 / 5 6 7 8 / 9 10 11 12 / 13 14 15 0');
    });

    it('formats a 3x2 puzzle correctly', () => {
        const ascii = new Puzzle([[1, 2, 3], [4, 5, 0]]).toAsciiString();
        expect(ascii).toBe('1 2 3 / 4 5 0');
    });
});

describe('Exception handling', () => {
    it('throws InvalidDimensionError for dimensions > MAX_SIZE', () => {
        expect(() => new Puzzle(MAX_SIZE + 1, MAX_SIZE + 1)).toThrow(InvalidDimensionError);
    });

    it('throws InvalidDimensionError for dimensions < MIN_SIZE', () => {
        expect(() => new Puzzle(MIN_SIZE - 1, MIN_SIZE - 1)).toThrow(InvalidDimensionError);
    });

    it('throws InvalidGridContentError for duplicate tiles', () => {
        expect(() => new Puzzle([[1, 1], [2, 0]])).toThrow(InvalidGridContentError);
    });

    it('throws InvalidGridContentError for out of range tile values', () => {
        expect(() => new Puzzle([[99, 1], [2, 0]])).toThrow(InvalidGridContentError);
    });

    it('throws InvalidPositionError for out of bounds position', () => {
        const puzzle = createSolved4x4Puzzle();
        expect(() => puzzle.getValue(4, 4)).toThrow(InvalidPositionError);
    });

    it('throws EmptyTileSlideError when sliding the empty tile', () => {
        const puzzle = createSolvable4x4Puzzle();
        expect(() => puzzle.slide(3, 1)).toThrow(EmptyTileSlideError);
    });

    it('throws BlockedPathError for a diagonal move', () => {
        const puzzle = createSolvable4x4Puzzle();
        expect(() => puzzle.slide(0, 0)).toThrow(BlockedPathError);
    });
});
