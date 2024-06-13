import { Grid, Cell, TCellStore } from './grid';
import { History } from './history';

export class Game {
    grid: Grid;
    running = false;
    history: History;
    cellsToDie = new Set<Cell>();
    cellsToSpawn = new Set<Cell>();
    genCount = 0;
    constructor(
        canvas: HTMLCanvasElement,
        public speedInput: HTMLInputElement,
        public spanCurrGen: HTMLSpanElement,
        public spanPopulation: HTMLSpanElement,
        public btnStart: HTMLButtonElement,
        public btnStop: HTMLButtonElement,
        public btnPrev: HTMLButtonElement,
        public btnNext: HTMLButtonElement,
        public btnClear: HTMLButtonElement
    ) {
        this.grid = new Grid(canvas);
        this.history = new History();
        this.updatePopulation();
        this.grid.render();
        this.enableListenners();
    }
    private countNeighboorsAlive(cell: Cell) {
        const { x, y } = cell;
        let count = 0;
        if (x - 1 in this.grid.cells && this.grid.cells[x - 1].includes(y))
            // left
            count++;
        if (x + 1 in this.grid.cells && this.grid.cells[x + 1].includes(y))
            // right
            count++;
        if (x - 1 in this.grid.cells && this.grid.cells[x - 1].includes(y - 1))
            // top-left
            count++;
        if (x + 1 in this.grid.cells && this.grid.cells[x + 1].includes(y - 1))
            // top-right
            count++;
        if (x - 1 in this.grid.cells && this.grid.cells[x - 1].includes(y + 1))
            // bottom-left
            count++;
        if (x + 1 in this.grid.cells && this.grid.cells[x + 1].includes(y + 1))
            // bottom-right
            count++;
        if (x in this.grid.cells && this.grid.cells[x].includes(y + 1))
            // bottom
            count++;
        if (x in this.grid.cells && this.grid.cells[x].includes(y - 1))
            // top
            count++;

        return count;
    }

    private updatePopulation() {
        this.spanPopulation.textContent = this.grid.cellCount.toString();
    }

    private handleCells() {
        const cellsToDie = this.cellsToDie;
        const cellsToSpawn = this.cellsToSpawn;
        if (cellsToDie.size > 0) {
            cellsToDie.forEach((c) => this.grid.killCell(c));
            cellsToDie.clear();
        }
        if (cellsToSpawn.size > 0) {
            cellsToSpawn.forEach((c) => this.grid.spawnCell(c));
            cellsToSpawn.clear();
        }
    }

    private hasChanged(lastGen: TCellStore, currGen: TCellStore) {
        if (JSON.stringify(lastGen) === JSON.stringify(currGen)) {
            this.history.peek();
            this.running = false;
            this.btnStart.removeAttribute('disabled');
            this.btnStop.setAttribute('disabled', '');
            this.btnPrev.removeAttribute('disabled');
        }
    }

    parseGrid() {
        for (let i = 0; i < this.grid.cellColumnsCount; i++) {
            for (let j = 0; j < this.grid.cellRowsCount; j++) {
                const cell = { x: i, y: j };
                if (
                    cell.x in this.grid.cells &&
                    this.grid.cells[cell.x].includes(cell.y)
                ) {
                    if (
                        this.countNeighboorsAlive(cell) < 2 ||
                        this.countNeighboorsAlive(cell) > 3
                    ) {
                        this.cellsToDie.add(cell);
                    }
                } else {
                    if (this.countNeighboorsAlive(cell) === 3) {
                        this.cellsToSpawn.add(cell);
                    }
                }
            }
        }
    }

    async start(once = false) {
        this.cellsToDie.clear();
        this.cellsToSpawn.clear();
        this.running = true;
        let lastGen;
        const sleep = (delay: number) =>
            new Promise((resolve) => setTimeout(resolve, delay));
        while (this.running) {
            lastGen = structuredClone(this.grid.cells);
            this.history.push(lastGen);
            this.parseGrid();
            this.handleCells();
            this.hasChanged(lastGen, this.grid.cells);
            this.increaseGenCount();
            this.updatePopulation();
            if (once) {
                this.running = false;
                return;
            }
            await sleep(1000 - parseInt(this.speedInput.value) + 200);
        }
    }
    stop() {
        this.running = false;
    }
    private parseClick(e: MouseEvent) {
        if (
            !this.running &&
            e.x >= this.grid.left &&
            e.x < this.grid.right &&
            e.y >= this.grid.top &&
            e.y <= this.grid.bottom
        ) {
            const x = Math.floor((e.x - this.grid.left) / this.grid.cellSize);
            const y = Math.floor((e.y - this.grid.top) / this.grid.cellSize);
            this.grid.toggleCell({ x, y });
            if (Object.keys(this.grid.cells).length) {
                this.btnClear.removeAttribute('disabled');
                this.btnNext.removeAttribute('disabled');
            } else {
                this.btnClear.setAttribute('disabled', '');
                this.btnNext.setAttribute('disabled', '');
            }
            this.updatePopulation();
        }
    }
    private enableListenners() {
        window.addEventListener('click', (e: MouseEvent) => this.parseClick(e));
        this.btnStart?.addEventListener('click', () => {
            this.btnStart.setAttribute('disabled', '');
            this.btnStop.removeAttribute('disabled');
            this.btnNext.setAttribute('disabled', '');
            this.btnPrev.setAttribute('disabled', '');
            this.start();
        });
        this.btnStop?.addEventListener('click', () => {
            this.btnStart.removeAttribute('disabled');
            this.btnStop.setAttribute('disabled', '');
            this.btnNext.removeAttribute('disabled');
            this.btnPrev.removeAttribute('disabled');
            this.stop();
        });
        this.btnPrev?.addEventListener('click', () => {
            this.prevGeneration();
            if (this.genCount === 0) this.btnPrev.setAttribute('disabled', '');
            this.btnNext.removeAttribute('disabled');
        });
        this.btnNext?.addEventListener('click', () => {
            this.nextGeneration();
            this.btnPrev.removeAttribute('disabled');
        });
        this.btnClear?.addEventListener('click', () => {
            this.reset();
            this.btnClear.setAttribute('disabled', '');
            this.btnNext.setAttribute('disabled', '');
            this.btnPrev.setAttribute('disabled', '');
        });
    }
    prevGeneration() {
        const last = this.history.pop();
        if (last) {
            this.grid.cells = last;
            this.decreaseGenCount();
            this.grid.drawSnapshot(last);
        }
    }
    nextGeneration() {
        this.start(true);
    }
    reset() {
        this.grid.cleanGrid();
        this.history.clear();
        this.resetGenCout();
    }
    increaseGenCount() {
        if (this.spanCurrGen?.textContent)
            this.spanCurrGen.textContent = (++this.genCount).toString();
    }
    decreaseGenCount() {
        if (this.spanCurrGen?.textContent)
            this.spanCurrGen.textContent = (--this.genCount).toString();
    }
    resetGenCout() {
        if (this.spanCurrGen?.textContent) {
            this.genCount = 0;
            this.spanCurrGen.textContent = this.genCount.toString();
        }
    }
}
