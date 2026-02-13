import { EventsEnum } from '../core/eventManager';
import { Game, GameStatesEnum } from '../core/game';
import { Coordinates } from '../core/grid';
import { debounce } from '../util';
import { Canvas } from './canvas';
import { Elements } from './elements';

export class UIController {
  elements!: Elements;
  game: Game;
  constructor(private canvas: Canvas) {
    this.game = new Game({
      grid: canvas.calculateGridDimensions(),
      events: true,
      delay: 10,
    });
  }

  attachElements(elements: Elements) {
    this.elements = elements;
    this.game.changeDelay(10 - parseInt(elements.speedSlider.value));
    this.subscribeToEvents();
  }

  toggleRun() {
    this.game.toggleRun();
  }

  reset() {
    this.game.reset();
  }

  changeDelay() {
    this.game.changeDelay(10 - parseInt(this.elements.speedSlider.value));
  }

  nextGrid() {
    this.game.nextGrid();
  }
  previousGrid() {
    this.game.previousGrid();
  }

  private onGridResize() {
    this.canvas.adjustCanvasesElementsDimensions();
    this.canvas.drawBackgroundCanvas();
    const { height, width } = this.canvas.calculateGridDimensions();
    this.game.changeGridDimensions({ height, width });
    this.game
      .getAliveCells()
      .forEach(({ y, x }) => this.canvas.drawCell({ y, x }));
    this.elements.setPopulation(this.game.getPopulation());
  }

  private registerCanvasEvents() {
    this.canvas.gameCanvasElement.addEventListener('click', (event) => {
      const rect = this.canvas.gameCanvasElement.getBoundingClientRect();

      const y = Math.floor((event.clientY - rect.top) / this.canvas.CELL_SIZE);
      const x = Math.floor((event.clientX - rect.left) / this.canvas.CELL_SIZE);

      this.game.eventManager?.emitCellToggled({
        y,
        x,
      });
    });

    window.addEventListener('resize', () => {
      this.game.eventManager?.emitGridResized();
    });
  }

  private registerGameEvents() {
    this.game.eventManager?.on(EventsEnum.GRID_RESETED, () => {
      this.canvas.clearAll();
      this.elements.setState(GameStatesEnum.GAME_IDLE);
      this.elements.setPopulation(this.game.getPopulation());
      this.elements.setGeneration(1);
    });

    this.game.eventManager?.on(EventsEnum.GAME_STATE_CHANGED, (event) => {
      this.elements.setState(event.detail);
    });

    this.game.eventManager?.on(
      EventsEnum.CELL_TOGGLED,
      (event: CustomEvent<Coordinates>) => {
        this.game.toggleCell(event.detail);
        this.elements.setPopulation(this.game.getPopulation());
      },
    );

    this.game.eventManager?.on(EventsEnum.GRID_UPDATED, () => {
      const state = this.game.getState();
      const historyLength = this.game.getHistoryLength();
      const population = this.game.getPopulation();

      if (state !== GameStatesEnum.GAME_RUNNING) {
        this.elements.enableNext();
        if (historyLength < 1) {
          this.elements.disablePrev();
        } else {
          this.elements.enablePrev();
        }
      }

      this.elements.setPopulation(population);
      this.elements.setGeneration(historyLength + 1);
    });

    this.game.eventManager?.on(
      EventsEnum.GRID_RESIZED,
      debounce(100, () => this.onGridResize()),
    );
    this.game.eventManager?.on(
      EventsEnum.CELL_BORN,
      (event: CustomEvent<Coordinates>) => {
        this.canvas.drawCell({ x: event.detail.x, y: event.detail.y });
      },
    );

    this.game.eventManager?.on(
      EventsEnum.CELL_KILLED,
      (event: CustomEvent<Coordinates>) => {
        this.canvas.clearCell({ x: event.detail.x, y: event.detail.y });
      },
    );
  }

  private subscribeToEvents() {
    this.registerCanvasEvents();
    this.registerGameEvents();
  }
}
