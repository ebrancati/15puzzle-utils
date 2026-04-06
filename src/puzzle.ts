import { DEFAULT_SIZE, MIN_SIZE, MAX_SIZE, EMPTY_TILE } from './constants';
import {
    PuzzleError,
    InvalidDimensionError,
    InvalidGridContentError,
    InvalidPositionError,
    EmptyTileSlideError,
    BlockedPathError
} from './exceptions';
import { Position, Parity, SlideResult } from './types';

export class Puzzle {
    private width: number;
    private height: number;
    private tiles: number[]; // Flattened 1D representation

    /** Creates a 4x4 shuffled puzzle */
    constructor();

    /** Creates a shuffled puzzle with the given dimensions */
    constructor(width: number, height?: number);

    /** Creates a puzzle from an existing grid */
    constructor(grid: number[][]);
    
    constructor(
        widthOrGrid: number | number[][] = DEFAULT_SIZE,
        height: number = DEFAULT_SIZE
    ) {
        if (Array.isArray(widthOrGrid)) { // Constructor with initial grid
            const grid = widthOrGrid;
            
            if (grid.length === 0) throw new InvalidDimensionError('Grid cannot be empty');

            this.height = grid.length;
            this.width = grid[0].length;

            // Validate all rows have the same width
            for (let row = 0; row < this.height; row++) {
                if (grid[row].length !== this.width) {
                    throw new InvalidDimensionError(
                        `Row ${row} has ${grid[row].length} columns, expected ${this.width}`
                    );
                }
            }

            this.throwIfDimensionsOutOfBounds(this.width, this.height);
            this.tiles = [];
            this.convertToFlatGrid(grid);
            this.throwIfGridContentInvalid();
        }
        else { // Constructor with dimensions
            const width = widthOrGrid;
            this.width = width;
            this.height = height;
            this.tiles = [];
            this.throwIfDimensionsOutOfBounds(width, height);
            this.initializeGrid();
            do {
                this.shuffleGrid();
                this.ensureSolvable();
            } while (this.isSolved());
        }
    }

    /** Returns true when the puzzle is in the solved state */
    isSolved(): boolean {
        let expectedValue = 1;
        const lastIndex = this.width * this.height - 1;

        for (let i = 0; i < lastIndex; i++) {
            if (this.tiles[i] !== expectedValue++) return false;
        }

        return this.tiles[lastIndex] === EMPTY_TILE;
    }

    /** Returns true when the current puzzle configuration is solvable */
    isSolvable(): boolean {
        const inversionParityTracker = this.getInversionParity();

        if (this.width % 2 === 0) return this.isEvenWidthPuzzleSolvable(inversionParityTracker);
        return this.isOddWidthPuzzleSolvable(inversionParityTracker);
    }

    /** Returns true when the tile at the given position can slide toward the empty space */
    canSlide(row: number, col: number): boolean {
        return this.validateSlideMove({ row, col }) === SlideResult.MOVE_IS_VALID;
    }

    /** Slides the tile at the given position and returns the move direction code */
    slide(row: number, col: number): string {
        const tileToSlide: Position = { row, col };
        this.throwIfSlideMoveIsInvalid(tileToSlide);

        const emptyPos = this.getEmptyPosition()!;

        if (this.isTileAdjacentToEmpty(tileToSlide, emptyPos)) {
            return this.slideSingleTile(tileToSlide, emptyPos);
        }
        else if (tileToSlide.row === emptyPos.row) {
            return this.slideHorizontal(tileToSlide, emptyPos);
        }
        else {
            return this.slideVertical(tileToSlide, emptyPos);
        }
    }

    /** Returns the puzzle grid as a 2D array */
    getGrid(): number[][] {
        const result: number[][] = Array(this.height)
            .fill(null)
            .map(() => Array(this.width));

        for (let row = 0; row < this.height; row++) {
            for (let col = 0; col < this.width; col++) {
                result[row][col] = this.at({ row, col });
            }
        }
        return result;
    }

    /** Returns the number of columns in the puzzle */
    getWidth(): number {
        return this.width;
    }

    /** Returns the number of rows in the puzzle */
    getHeight(): number {
        return this.height;
    }

    /** Returns the tile value at the given position */
    getValue(row: number, col: number): number {
        const pos: Position = { row, col };
        this.throwIfPositionOutOfBounds(pos);
        return this.at(pos);
    }

    /** Returns the position of the empty space, or null if the grid is invalid */
    getEmptyPosition(): Position | null {
        const emptyIndex = this.findEmptyIndex();
        if (emptyIndex === -1) return null;

        return {
            row: Math.floor(emptyIndex / this.width),
            col: emptyIndex % this.width
        };
    }

    /** Returns the puzzle state as an ASCII string */
    toAsciiString(): string {
        let ascii = '';

        for (let row = 0; row < this.height; row++) {
            for (let col = 0; col < this.width; col++) {
                ascii += this.at({ row, col }).toString();
                if (this.isNotLastCol(col)) {
                    ascii += ' ';
                }
            }
            if (this.isNotLastRow(row)) {
                ascii += ' / ';
            }
        }
        return ascii;
    }

    // ========== Grid Access ==================================================

    private at(pos: Position): number {
        return this.tiles[pos.row * this.width + pos.col];
    }

    private swap(pos1: Position, pos2: Position): void {
        const i = pos1.row * this.width + pos1.col;
        const j = pos2.row * this.width + pos2.col;
        [this.tiles[i], this.tiles[j]] = [this.tiles[j], this.tiles[i]];
    }

    private findEmptyIndex(): number {
        for (let i = 0; i < this.tiles.length; i++) {
            if (this.tiles[i] === EMPTY_TILE) return i;
        }
        return -1;
    }

    private getNonEmptyTiles(): number[] {
        const nonEmptyTiles: number[] = [];

        for (const tile of this.tiles) {
            if (tile !== EMPTY_TILE) {
                nonEmptyTiles.push(tile);
            }
        }

        return nonEmptyTiles;
    }

    private isNotLastRow(row: number): boolean {
        return row < this.height - 1;
    }

    private isNotLastCol(col: number): boolean {
        return col < this.width - 1;
    }

    // ========== Initialization ===============================================

    private initializeGrid(): void {
        const totalTiles = this.width * this.height;
        this.tiles = [];

        for (let i = 0; i < totalTiles - 1; i++) {
            this.tiles.push(i + 1);
        }

        this.tiles.push(EMPTY_TILE); // Empty tile at bottom right
    }

    private shuffleGrid(): void {
        for (let i = this.tiles.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.tiles[i], this.tiles[j]] = [this.tiles[j], this.tiles[i]];
        }
    }

    private convertToFlatGrid(grid: number[][]): void {
        this.tiles = [];

        for (let row = 0; row < this.height; row++) {
            for (let col = 0; col < this.width; col++) {
                this.tiles.push(grid[row][col]);
            }
        }
    }

    // ========== Move Calculation =============================================

    private isTileAdjacentToEmpty(tileToSlide: Position, emptyPos: Position): boolean {
        const rowDiff = Math.abs(tileToSlide.row - emptyPos.row);
        const colDiff = Math.abs(tileToSlide.col - emptyPos.col);
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    }

    private calculateMoveDirection(from: Position, to: Position): string {
        if (from.row < to.row) return 'D'; // Tile moved down
        if (from.row > to.row) return 'U'; // Tile moved up
        if (from.col < to.col) return 'R'; // Tile moved right
        return 'L'; // Tile moved left
    }

    // ========== Slide Operations =============================================

    private slideSingleTile(tileToSlide: Position, emptyPos: Position): string {
        this.swap(tileToSlide, emptyPos);
        return this.calculateMoveDirection(tileToSlide, emptyPos);
    }

    private slideHorizontal(tileToSlide: Position, emptyPos: Position): string {
        const tilesMovedCount = Math.abs(tileToSlide.col - emptyPos.col);
        let direction: string;

        if (tileToSlide.col < emptyPos.col) {
            // Slide tiles leftward
            direction = 'L';
            for (let col = emptyPos.col; col > tileToSlide.col; col--) {
                this.swap({ row: tileToSlide.row, col }, { row: tileToSlide.row, col: col - 1 });
            }
        }
        else {
            // Slide tiles rightward
            direction = 'R';
            for (let col = emptyPos.col; col < tileToSlide.col; col++) {
                this.swap({ row: tileToSlide.row, col }, { row: tileToSlide.row, col: col + 1 });
            }
        }

        return direction + tilesMovedCount.toString();
    }

    private slideVertical(tileToSlide: Position, emptyPos: Position): string {
        const tilesMovedCount = Math.abs(tileToSlide.row - emptyPos.row);
        let direction: string;

        if (tileToSlide.row < emptyPos.row) {
            // Slide tiles upward
            direction = 'U';
            for (let row = emptyPos.row; row > tileToSlide.row; row--) {
                this.swap({ row, col: tileToSlide.col }, { row: row - 1, col: tileToSlide.col });
            }
        }
        else {
            // Slide tiles downward
            direction = 'D';
            for (let row = emptyPos.row; row < tileToSlide.row; row++) {
                this.swap({ row, col: tileToSlide.col }, { row: row + 1, col: tileToSlide.col });
            }
        }

        return direction + tilesMovedCount.toString();
    }

    // ========== Validation ===================================================

    private throwIfDimensionsOutOfBounds(width: number, height: number): void {
        if (width < MIN_SIZE || width > MAX_SIZE || height < MIN_SIZE || height > MAX_SIZE) {
            throw new InvalidDimensionError(
                `Board dimensions must be between ${MIN_SIZE} and ${MAX_SIZE}`
            );
        }
    }

    private throwIfGridContentInvalid(): void {
        const totalTiles = this.width * this.height;
        const seen: boolean[] = new Array(totalTiles).fill(false);

        for (const value of this.tiles) {
            this.throwIfTileValueOutOfRange(value, totalTiles);
            this.throwIfDuplicateTileValueFound(value, seen);
            seen[value] = true;
        }
    }

    private throwIfTileValueOutOfRange(value: number, totalTiles: number): void {
        if (value < 0 || value >= totalTiles) {
            throw new InvalidGridContentError(
                `Tile value ${value} is out of valid range [0, ${totalTiles - 1}]`
            );
        }
    }

    private throwIfDuplicateTileValueFound(value: number, seen: boolean[]): void {
        if (seen[value]) {
            throw new InvalidGridContentError(`Duplicate tile value detected: ${value}`);
        }
    }

    private throwIfPositionOutOfBounds(pos: Position): void {
        if (
            pos.row < 0 || pos.row >= this.height ||
            pos.col < 0 || pos.col >= this.width
        ) {
            throw new InvalidPositionError(
                `Position (${pos.row}, ${pos.col}) is out of bounds for ${this.width}x${this.height} grid`
            );
        }
    }

    private validateSlideMove(tileToSlide: Position): SlideResult {
        try {
            this.throwIfPositionOutOfBounds(tileToSlide);
        } catch (e) {
            if (e instanceof InvalidPositionError) return SlideResult.POSITION_OUT_OF_BOUNDS;
            throw e;
        }

        if (this.at(tileToSlide) === EMPTY_TILE) return SlideResult.CANNOT_SLIDE_EMPTY_TILE;

        const emptyPos = this.getEmptyPosition();
        if (!emptyPos) return SlideResult.EMPTY_TILE_NOT_FOUND;

        // Single-slide move (adjacent tile)
        if (this.isTileAdjacentToEmpty(tileToSlide, emptyPos)) return SlideResult.MOVE_IS_VALID;

        // Multi-slide move (same row/column)
        if (tileToSlide.row === emptyPos.row) return SlideResult.MOVE_IS_VALID;
        if (tileToSlide.col === emptyPos.col) return SlideResult.MOVE_IS_VALID;

        return SlideResult.PATH_TO_EMPTY_SPACE_IS_BLOCKED; // Cannot slide diagonally
    }

    private throwIfSlideMoveIsInvalid(tileToSlide: Position): void {
        const result = this.validateSlideMove(tileToSlide);

        if (result === SlideResult.MOVE_IS_VALID) return;

        switch (result) {
            case SlideResult.POSITION_OUT_OF_BOUNDS:
                throw new InvalidPositionError(`Position (${tileToSlide.row}, ${tileToSlide.col}) is out of bounds`);

            case SlideResult.CANNOT_SLIDE_EMPTY_TILE:
                throw new EmptyTileSlideError(`No tile at position (${tileToSlide.row}, ${tileToSlide.col})`);

            case SlideResult.EMPTY_TILE_NOT_FOUND:
                throw new PuzzleError('Puzzle grid is corrupted: empty tile not found');

            case SlideResult.PATH_TO_EMPTY_SPACE_IS_BLOCKED: {
                const emptyPos = this.getEmptyPosition()!;
                throw new BlockedPathError(
                    `Tile at position (${tileToSlide.row}, ${tileToSlide.col}) cannot slide to empty space at (${emptyPos.row}, ${emptyPos.col}): must be same row or column as empty space`
                );
            }
            
            default:
                throw new PuzzleError('Unknown error occurred');
        }
    }

    // ========== Solvability ==================================================

    private ensureSolvable(): void {
        if (!this.isSolvable()) {
            let pos1 = -1,
                pos2 = -1;

            // Find positions of tiles with value 1 and 2
            for (let i = 0; i < this.tiles.length; i++) {
                if (this.tiles[i] === 1) pos1 = i;
                if (this.tiles[i] === 2) pos2 = i;
                if (pos1 !== -1 && pos2 !== -1) break;
            }

            [this.tiles[pos1], this.tiles[pos2]] = [this.tiles[pos2], this.tiles[pos1]];
        }
    }

    private getInversionParity(): Parity {
        const nonEmptyTiles = this.getNonEmptyTiles();
        let inversions = 0;

        for (let i = 0; i < nonEmptyTiles.length; i++) {
            for (let j = i + 1; j < nonEmptyTiles.length; j++) {
                if (nonEmptyTiles[i] > nonEmptyTiles[j]) inversions++;
            }
        }

        return inversions % 2 === 0 ? Parity.EVEN : Parity.ODD;
    }

    private isOddWidthPuzzleSolvable(inversionParityTracker: Parity): boolean {
        return inversionParityTracker === Parity.EVEN;
    }

    private isEvenWidthPuzzleSolvable(inversionParityTracker: Parity): boolean {
        const emptyIndex = this.findEmptyIndex();
        const emptyTileRowIndexFromTop = Math.floor(emptyIndex / this.width);
        const emptyTileRowIndexFromBottom = this.height - emptyTileRowIndexFromTop - 1;

        const rowParity = emptyTileRowIndexFromBottom % 2 === 0 ? Parity.EVEN : Parity.ODD;
        return inversionParityTracker === rowParity;
    }
}
