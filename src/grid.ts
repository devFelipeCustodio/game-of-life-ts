export interface Cell {
    x: number;
    y: number;
}

export type TCellStore = Record<number, Array<number>>;

export class Grid {
    cells: TCellStore = {};
    borderOffset: number = 1;
    container: HTMLDivElement;
    ctx: CanvasRenderingContext2D;
    public cellColumnsCount: number;
    public cellRowsCount: number;
    public cellCount = 0;
    public left: number;
    public right: number;
    public top: number;
    public bottom: number;

    constructor(canvas: HTMLCanvasElement, public cellSize = 20) {
        this.ctx = this.getContext(canvas);
        this.container = canvas.parentNode as HTMLDivElement;
        canvas.width =
            this.containerWidth() - (this.containerWidth() % this.cellSize);
        canvas.height =
            this.containerHeight() - (this.containerHeight() % this.cellSize);
        this.left = canvas.offsetLeft;
        this.right = canvas.offsetLeft + canvas.clientWidth;
        this.top = canvas.offsetTop;
        this.bottom = canvas.offsetTop + canvas.clientHeight;
        this.cellColumnsCount = Math.floor(
            this.containerWidth() / this.cellSize
        );
        this.cellRowsCount = Math.floor(this.containerHeight() / this.cellSize);
    }
    render() {
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';

        let i, j;
        for (i = 1; i < this.containerHeight(); i += this.cellSize) {
            for (j = 1; j < this.containerWidth(); j += this.cellSize) {
                if (
                    i + this.cellSize <= this.containerHeight() &&
                    j + this.cellSize <= this.containerWidth()
                ) {
                    this.ctx.strokeRect(j, i, this.cellSize, this.cellSize);
                }
            }
        }
    }
    private getContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
        if (!canvas.getContext)
            throw new Error('Este navegador não suporta o elemento canvas!');
        const ctx = canvas.getContext('2d')!;
        return ctx;
    }
    private containerWidth() {
        return this.container.getBoundingClientRect().width;
    }
    private containerHeight() {
        return this.container.getBoundingClientRect().height;
    }
    private drawCell(cell: Cell) {
        this.ctx.fillStyle = 'rgb(150, 0, 0)';
        this.ctx.fillRect(
            cell.x * this.cellSize + this.borderOffset,
            cell.y * this.cellSize + this.borderOffset,
            this.cellSize,
            this.cellSize
        );
        this.cellCount++;
    }

    cleanGrid() {
        this.cells = {};
        let i, j;
        for (i = 0; i < this.cellColumnsCount; i++) {
            for (j = 0; j < this.cellRowsCount; j++) {
                this.clearCell({ x: i, y: j });
            }
        }
    }

    drawSnapshot(snapshot: TCellStore) {
        this.cleanGrid();
        this.cells = snapshot;
        let x: any;
        for (x in snapshot) {
            snapshot[x].forEach((y) => {
                this.drawCell({ x, y });
            });
        }
    }

    private clearCell(cell: Cell) {
        this.ctx.clearRect(
            cell.x * this.cellSize + this.borderOffset,
            cell.y * this.cellSize + this.borderOffset,
            this.cellSize,
            this.cellSize
        );
        this.ctx.strokeRect(
            cell.x * this.cellSize + this.borderOffset,
            cell.y * this.cellSize + this.borderOffset,
            this.cellSize,
            this.cellSize
        );
        this.cellCount--;
    }
    toggleCell(cell: Cell) {
        if (cell.x in this.cells && this.cells[cell.x].includes(cell.y)) {
            this.killCell(cell);
            return;
        }
        this.spawnCell(cell);
    }
    spawnCell(cell: Cell) {
        if (this.cells.hasOwnProperty(cell.x)) this.cells[cell.x].push(cell.y);
        else this.cells[cell.x] = [cell.y];
        this.drawCell(cell);
    }
    killCell(cell: Cell) {
        if (this.cells[cell.x]) {
            const index = this.cells[cell.x].indexOf(cell.y);
            if (index > -1) {
                this.cells[cell.x].splice(index, 1);
                if (this.cells[cell.x].length === 0) delete this.cells[cell.x];
                this.clearCell(cell);
            }
        }
    }
}
