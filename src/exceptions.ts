export class PuzzleError extends Error {
    constructor(message: string) {
        super(message);
        this.name = this.constructor.name;
        Object.setPrototypeOf(this, PuzzleError.prototype);
    }
}

export class InvalidDimensionError extends PuzzleError {
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, InvalidDimensionError.prototype);
    }
}

export class InvalidGridContentError extends PuzzleError {
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, InvalidGridContentError.prototype);
    }
}

export class InvalidPositionError extends PuzzleError {
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, InvalidPositionError.prototype);
    }
}

export class EmptyTileSlideError extends PuzzleError {
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, EmptyTileSlideError.prototype);
    }
}

export class BlockedPathError extends PuzzleError {
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, BlockedPathError.prototype);
    }
}
