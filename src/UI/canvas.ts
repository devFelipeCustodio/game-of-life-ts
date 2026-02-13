import { Coordinates } from '../core/grid';

export class Canvas {
  readonly GRID_MARGIN_X = 3;
  readonly GRID_MARGIN_Y = 1;
  readonly CELL_SIZE = 20;
  readonly canvasContainer: HTMLDivElement;
  readonly backgroundCanvasElement: HTMLCanvasElement;
  readonly gameCanvasElement: HTMLCanvasElement;
  readonly backgroundCanvasContext: CanvasRenderingContext2D;
  readonly gameCanvasContext: CanvasRenderingContext2D;

  constructor() {
    this.canvasContainer = this.getCanvasContainer();
    this.backgroundCanvasElement = this.getBackgroundCanvas();
    this.gameCanvasElement = this.getGameCanvas();
    this.backgroundCanvasContext = this.getBackgroundCanvasContext();
    this.gameCanvasContext = this.getGameCanvasContext();

    this.adjustCanvasesElementsDimensions();
    this.drawBackgroundCanvas();
  }
  private getCanvasContainer() {
    const canvasContainer =
      document.querySelector<HTMLDivElement>('#canvasContainer');
    if (!canvasContainer) throw Error();
    return canvasContainer;
  }

  private getBackgroundCanvas() {
    const bgCanvas = document.querySelector<HTMLCanvasElement>('#bgCanvas');
    if (!bgCanvas) throw Error();
    return bgCanvas;
  }

  private getGameCanvas() {
    const gameCanvas = document.querySelector<HTMLCanvasElement>('#gameCanvas');
    if (!gameCanvas) throw Error();
    return gameCanvas;
  }

  private getBackgroundCanvasContext() {
    const context = this.backgroundCanvasElement.getContext('2d');
    if (!context) throw Error();
    return context;
  }

  private getGameCanvasContext() {
    const context = this.gameCanvasElement.getContext('2d');
    if (!context) throw Error();
    return context;
  }

  adjustCanvasesElementsDimensions() {
    const containerClientRect = this.canvasContainer.getBoundingClientRect();

    const canvasWidth =
      Math.floor(containerClientRect.width / this.CELL_SIZE) * this.CELL_SIZE -
      this.CELL_SIZE * this.GRID_MARGIN_X;
    const canvasHeight =
      Math.floor(containerClientRect.height / this.CELL_SIZE) * this.CELL_SIZE -
      this.CELL_SIZE * this.GRID_MARGIN_Y;

    this.backgroundCanvasElement.width = canvasWidth;
    this.backgroundCanvasElement.height = canvasHeight;
    this.gameCanvasElement.width = canvasWidth;
    this.gameCanvasElement.height = canvasHeight;

    const canvasMarginInline = (containerClientRect.width - canvasWidth) / 2;
    const canvasMarginBlock = (containerClientRect.height - canvasHeight) / 2;

    this.backgroundCanvasElement.style.marginInline = canvasMarginInline + 'px';
    this.backgroundCanvasElement.style.marginBlock = canvasMarginBlock + 'px';
    this.gameCanvasElement.style.marginBlock = canvasMarginBlock + 'px';
    this.gameCanvasElement.style.marginInline = canvasMarginInline + 'px';
  }

  calculateGridDimensions() {
    return {
      height: Math.floor(
        this.backgroundCanvasElement.clientHeight / this.CELL_SIZE,
      ),
      width: Math.floor(
        this.backgroundCanvasElement.clientWidth / this.CELL_SIZE,
      ),
    };
  }

  drawBackgroundCanvas() {
    const { width, height } = this.calculateGridDimensions();
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        this.backgroundCanvasContext.strokeStyle = '#dee2e610';
        this.backgroundCanvasContext.strokeRect(
          x * this.CELL_SIZE,
          y * this.CELL_SIZE,
          this.CELL_SIZE,
          this.CELL_SIZE,
        );
      }
    }
  }

  drawCell({ x, y }: Coordinates) {
    this.gameCanvasContext.fillStyle = '#0d6efd';
    this.gameCanvasContext.fillRect(
      x * this.CELL_SIZE,
      y * this.CELL_SIZE,
      this.CELL_SIZE,
      this.CELL_SIZE,
    );
  }

  clearCell({ x, y }: Coordinates) {
    this.gameCanvasContext.clearRect(
      x * this.CELL_SIZE,
      y * this.CELL_SIZE,
      this.CELL_SIZE,
      this.CELL_SIZE,
    );
  }

  clearAll() {
    const { width, height } = this.calculateGridDimensions();

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        this.gameCanvasContext.clearRect(
          x * this.CELL_SIZE,
          y * this.CELL_SIZE,
          this.CELL_SIZE,
          this.CELL_SIZE,
        );
      }
    }
  }
}
