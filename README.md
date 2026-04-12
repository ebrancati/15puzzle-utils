# 15puzzle-utils

Utility library for creating and manipulating sliding puzzles

## Installation

```bash
npm install 15puzzle-utils
```

## Usage

```ts
import { Puzzle } from '15puzzle-utils';

// Pick one of these constructors:
const puzzle = new Puzzle();     // 4x4, randomly shuffled, solvable
const puzzle = new Puzzle(3, 5); // custom size, randomly shuffled, solvable
const puzzle = new Puzzle([
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 0]
]); 

// Methods
puzzle.isSolved()         // true when puzzle is complete
puzzle.isSolvable()       // true when puzzle can be solved
puzzle.canSlide(row, col) // check if tile can slide
puzzle.slide(row, col)    // slide tile toward empty space
puzzle.getGrid()          // current state as number[][]
puzzle.getWidth()         // number of columns
puzzle.getHeight()        // number of rows
puzzle.getValue(row, col) // value at a specific cell
puzzle.getEmptyPosition() // { row, col } of the empty tile
puzzle.toAsciiString()    // text representation
```

## Error Handling

All errors extend `PuzzleError`, so you can catch them generically or handle specific cases:

```ts
import { Puzzle, PuzzleError, BlockedPathError } from '15puzzle-utils';

// Catch any puzzle error
try {
    puzzle.slide(row, col);
} catch (e) {
    if (e instanceof PuzzleError) { ... }
}

// Or handle specific cases
try {
    puzzle.slide(row, col);
} catch (e) {
    if (e instanceof BlockedPathError) { ... }
}
```

| Error | Thrown by |
|---|---|
| `InvalidDimensionError` | `constructor(width, height)`, `constructor(grid)` invalid width/height |
| `InvalidGridContentError` | `constructor(grid)` duplicate or out-of-range tile values |
| `InvalidPositionError` | `slide(row, col)`, `getValue(row, col)` row/col out of bounds |
| `EmptyTileSlideError` | `slide(row, col)` target cell is the empty tile |
| `BlockedPathError` | `slide(row, col)` tile not in same row or column as empty space |

## License

[MIT](LICENSE)
