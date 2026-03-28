import { Puzzle } from '../src/puzzle';
import { EMPTY_TILE } from '../src/constants';

declare const Prism: {
    plugins: {
        toolbar: {
            registerButton: (key: string, fn: (env: { element: HTMLElement }) => HTMLElement | void) => void;
        };
    };
    highlightElement: (element: HTMLElement) => void;
    highlightAll: () => void;
};

let puzzle = new Puzzle();

renderPuzzleGrid();

Prism.plugins.toolbar.registerButton('run', (env) => {
    const pre = env.element.parentElement;
    const runId = pre?.dataset.runId;
    if (!runId) return;

    const button = document.createElement('button');
    button.textContent = 'Try';

    button.addEventListener('click', async () => {
        const outputContainer = document.getElementById('code-output')!;
        const output = outputContainer.querySelector('code')!;
        outputContainer.style.display = 'none';
        output.textContent = '';

        let shouldHighlight = true;

        switch (runId) {
            case 'try-default': {
                puzzle = new Puzzle();
                output.textContent = `// new 4x4 puzzle created\n${puzzle.toAsciiString()}`;
                break;
            }
            case 'try-size': {
                puzzle = new Puzzle(3, 5);
                output.textContent = `// new 3x5 puzzle created\n${puzzle.toAsciiString()}`;
                break;
            }
            case 'try-array1':
            case 'try-array2': {
                const arrayData = JSON.parse(pre!.dataset.array!);
                puzzle = new Puzzle(arrayData);
                output.textContent = `// ${pre!.dataset.msg!}\n${puzzle.toAsciiString()}`;
                break;
            }
            case 'try-solved': {
                output.textContent = `${puzzle.isSolved()}`;
                break;
            }
            case 'try-solvable': {
                output.textContent = `${puzzle.isSolvable()}`;
                break;
            }
            case 'try-canslide': {
                try {
                    const coords = await showCoordModal('canSlide');
                    if (coords) {
                        const [row, col] = coords;
                        output.textContent = `${puzzle.canSlide(row, col)}`;
                    }
                } catch (error) {
                    output.textContent = getErrorMessage(error);
                    shouldHighlight = false;
                }
                break;
            }
            case 'try-slide': {
                try {
                    const coords = await showCoordModal('slide');
                    if (coords) {
                        const [row, col] = coords;
                        output.textContent = `"${puzzle.slide(row, col)}"`;
                    }
                } catch (error) {
                    output.textContent = getErrorMessage(error);
                    shouldHighlight = false;
                }
                break;
            }
            case 'try-grid': {
                const grid = puzzle.getGrid();
                output.textContent = JSON.stringify(grid);
                break;
            }
            case 'try-dimensions': {
                output.textContent = `${puzzle.getWidth()} x ${puzzle.getHeight()}`;
                break;
            }
            case 'try-value': {
                try {
                    const coords = await showCoordModal('getValue');
                    if (coords) {
                        const [row, col] = coords;
                        output.textContent = `${puzzle.getValue(row, col)}`;
                    }
                } catch (error) {
                    output.textContent = getErrorMessage(error);
                    shouldHighlight = false;
                }
                break;
            }
            case 'try-emptypos': {
                const emptyPos = puzzle.getEmptyPosition();
                output.textContent = `{ row: ${emptyPos!.row}, col: ${emptyPos!.col} }`;
                break;
            }
            case 'try-ascii': {
                output.textContent = puzzle.toAsciiString();
                break;
            }
        }

        if (output.textContent) {
            outputContainer.style.display = 'block';
            if (shouldHighlight) Prism.highlightElement(output);
            outputContainer.classList.remove('updated');
            void outputContainer.offsetWidth; // force reflow to restart animation
            outputContainer.classList.add('updated');

            // Scrolls to the top of the page on mobile viewports after a puzzle action
            if (window.matchMedia('(max-width: 75rem)').matches) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }

        renderPuzzleGrid();
    });

    return button;
});

Prism.highlightAll();

document.querySelector('.install-command')?.addEventListener('click', (e) => {
    const copyBtn = (e.currentTarget as HTMLElement)
        .closest('.code-toolbar')
        ?.querySelector<HTMLButtonElement>('.copy-to-clipboard-button');
    copyBtn?.click();
});

function renderPuzzleGrid() {
    const grid = document.getElementById('puzzle-grid')!;
    const puzzleGrid = puzzle.getGrid();
    const cols = puzzleGrid[0]?.length || 4;

    grid.innerHTML = '';
    grid.style.gridTemplateColumns = `auto repeat(${cols}, 1fr)`;

    // Header row: empty corner + column indices
    grid.appendChild(document.createElement('div'));
    for (let col = 0; col < cols; col++) {
        grid.appendChild(createCoordCell(col.toString(), 'coord-top'));
    }

    // Data rows: row index + tiles
    puzzleGrid.forEach((rowData, row) => {
        grid.appendChild(createCoordCell(row.toString(), 'coord-left'));
        rowData.forEach((value, col) => {
            grid.appendChild(createTile(value, row, col));
        });
    });
}

function createTile(tileNumber: number, row: number, col: number) {
    const tile = document.createElement('div');

    if (tileNumber === EMPTY_TILE) {
        tile.className = 'tile empty';
    } else {
        tile.className = 'tile';
        tile.textContent = tileNumber.toString();
    }

    addLabel(tile, 'tooltip', `{ row: ${row}, col: ${col} }`);

    return tile;
}

function createCoordCell(content: string, extraClass: string) {
    const label = document.createElement('div');
    label.className = `coord-label ${extraClass}`;
    label.textContent = content;
    return label;
}

function addLabel(parent: HTMLElement, className: string, content: string) {
    const label = document.createElement('div');
    label.className = className;
    label.textContent = content;
    parent.appendChild(label);
}

function showCoordModal(methodName: string): Promise<[number, number] | null> {
    return new Promise((resolve) => {
        const modal = document.getElementById('coord-modal')!;
        const methodSpan = document.getElementById('modal-method')!;
        const rowInput = document.getElementById('modal-row') as HTMLInputElement;
        const colInput = document.getElementById('modal-col') as HTMLInputElement;
        const confirmBtn = document.getElementById('modal-confirm')!;
        const cancelBtn = document.getElementById('modal-cancel')!;

        methodSpan.textContent = methodName;
        rowInput.value = '0';
        colInput.value = '0';
        modal.hidden = false;
        rowInput.focus();
        rowInput.select();

        function close(result: [number, number] | null) {
            modal.hidden = true;
            confirmBtn.removeEventListener('click', onConfirm);
            cancelBtn.removeEventListener('click', onCancel);
            document.removeEventListener('keydown', onKeydown);
            resolve(result);
        }

        function onConfirm() {
            const row = parseInt(rowInput.value);
            const col = parseInt(colInput.value);
            if (isNaN(row) || isNaN(col)) return;
            close([row, col]);
        }

        function onCancel() { close(null); }

        function onKeydown(e: KeyboardEvent) {
            if (e.key === 'Enter') onConfirm();
            if (e.key === 'Escape') onCancel();
        }

        confirmBtn.addEventListener('click', onConfirm);
        cancelBtn.addEventListener('click', onCancel);
        document.addEventListener('keydown', onKeydown);
    });
}

function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    return String(error);
}
