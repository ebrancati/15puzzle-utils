/** Base class for all puzzle errors */
export class PuzzleError extends Error {
    constructor(message: string) {
        super(message);
        this.name = this.constructor.name;
        Object.setPrototypeOf(this, PuzzleError.prototype);
    }
}

/** Thrown when grid dimensions are outside the allowed range */
export class InvalidDimensionError extends PuzzleError {
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, InvalidDimensionError.prototype);
    }
}

/** Thrown when the grid contains duplicate or out-of-range tile values */
export class InvalidGridContentError extends PuzzleError {
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, InvalidGridContentError.prototype);
    }
}

/** Thrown when a position is outside the grid boundaries */
export class InvalidPositionError extends PuzzleError {
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, InvalidPositionError.prototype);
    }
}

/** Thrown when attempting to slide the empty space */
export class EmptyTileSlideError extends PuzzleError {
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, EmptyTileSlideError.prototype);
    }
}

/** Thrown when a tile cannot reach the empty space because it is not on the same row or column */
export class BlockedPathError extends PuzzleError {
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, BlockedPathError.prototype);
    }
}
