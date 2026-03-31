/** Position in the puzzle grid */
export interface Position {
    row: number;
    col: number;
}

/** Used to determine puzzle solvability via inversion counting */
export enum Parity {
    EVEN = 0,
    ODD = 1
}

/** Possible outcomes when validating a slide move */
export enum SlideResult {
    MOVE_IS_VALID = 'MOVE_IS_VALID',
    POSITION_OUT_OF_BOUNDS = 'POSITION_OUT_OF_BOUNDS',
    CANNOT_SLIDE_EMPTY_TILE = 'CANNOT_SLIDE_EMPTY_TILE',
    EMPTY_TILE_NOT_FOUND = 'EMPTY_TILE_NOT_FOUND',
    PATH_TO_EMPTY_SPACE_IS_BLOCKED = 'PATH_TO_EMPTY_SPACE_IS_BLOCKED'
}
