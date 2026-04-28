import { sleep } from '../util';
import { EventManager } from './eventManager';
import { Coordinates, Grid, GridDimensions } from './grid';
import { GridHistory } from './gridHistory';

type GameOptions = {
  grid: GridDimensions | Grid;
  gridHistory?: GridHistory;
  events?: boolean | EventManager;
  delay?: number;
};

export const GameStatesEnum = {
  GAME_IDLE: 'gameOfLife_gameIdle',
  GAME_READY: 'gameOfLife_gameReady',
  GAME_RUNNING: 'gameOfLife_gameRunning',
  GAME_ENDED: 'gameOfLife_gameEnded',
  GAME_ENDED_WITH_POPULATION: 'gameOfLife_gameEndedWithPopulation',
} as const;

export type GameStates = (typeof GameStatesEnum)[keyof typeof GameStatesEnum];

export class Game {
  eventManager: EventManager | undefined;
  private state: GameStates = GameStatesEnum.GAME_IDLE;
  private latestOpts: GameOptions;
  private grid: Grid;
  private gridHistory: GridHistory;
  private delay: number;
  private cursor: Coordinates = { y: 0, x: 0 };
  private population = 0;

  constructor(opts: GameOptions) {
    this.latestOpts = opts;
    this.delay = (opts.delay || 1000) * 100;
    if (opts.grid instanceof Grid) this.grid = opts.grid;
    else
      this.grid = new Grid({
        height: opts.grid.height,
        width: opts.grid.width,
      });
    if (opts.events instanceof EventManager) {
      this.eventManager = opts.events;
    } else if (opts.events) {
      this.eventManager = new EventManager();
    }
    if (!opts.gridHistory) this.gridHistory = new GridHistory();
    else this.gridHistory = opts.gridHistory;
  }

  getGrid() {
    return this.grid;
  }

  getState() {
    return this.state;
  }

  private setState(state: GameStates) {
    switch (state) {
      case GameStatesEnum.GAME_IDLE:
        this.state = GameStatesEnum.GAME_IDLE;
        break;
      case GameStatesEnum.GAME_READY:
        this.state = GameStatesEnum.GAME_READY;
        break;
      case GameStatesEnum.GAME_RUNNING:
        this.state = GameStatesEnum.GAME_RUNNING;
        break;
      case GameStatesEnum.GAME_ENDED:
        this.state = GameStatesEnum.GAME_ENDED;
        break;
      case GameStatesEnum.GAME_ENDED_WITH_POPULATION:
        this.state = GameStatesEnum.GAME_ENDED_WITH_POPULATION;
        break;
    }
    this.eventManager?.emitGameStateChanged(state);
  }

  getHistoryLength() {
    return this.gridHistory.getLength();
  }

  toggleCell(coords: Coordinates) {
    const isAlive = this.grid.toggleAt(coords);

    if (isAlive === 1) {
      this.eventManager?.emitCellBorn(coords);
      this.population++;
    } else if (isAlive === 0) {
      this.eventManager?.emitCellKilled(coords);
      this.population--;
    } else throw Error('cell not found');
    if (this.population > 0) this.setState(GameStatesEnum.GAME_READY);
    else this.setState(GameStatesEnum.GAME_IDLE);
  }

  private enlivenCell(coords?: Coordinates) {
    this.grid.enableAt(coords ?? this.cursor);
    this.eventManager?.emitCellBorn(coords ?? this.cursor);
    this.population++;
  }

  private killCell(coords?: Coordinates) {
    this.grid.disableAt(coords ?? this.cursor);
    this.eventManager?.emitCellKilled(coords ?? this.cursor);
    this.population--;
  }

  getPopulation() {
    return this.population;
  }

  private getLastGenCellAt(coords: Coordinates) {
    const lastHistEntry = this.gridHistory.lookback();
    return lastHistEntry.grid.getAtWithMetadata(coords);
  }

  private getLastGenCell() {
    return this.getLastGenCellAt(this.cursor);
  }

  private countNeighboursAlive() {
    let aliveCount = 0;
    for (const v of Object.values(this.getLastGenCell().neighbours)) {
      if (v === 1) aliveCount++;
    }
    return aliveCount;
  }

  private cloneCurrentGridInstance() {
    const clone = structuredClone(this.grid);
    return Object.setPrototypeOf(clone, Grid.prototype) as Grid;
  }

  private parseLastGeneration() {
    this.resetCursor();
    this.gridHistory.push({
      grid: this.cloneCurrentGridInstance(),
      population: this.population,
    });
    const dimensions = this.grid.getDimensions();
    let didChange = false;
    while (this.cursor.y < dimensions.height) {
      while (this.cursor.x < dimensions.width) {
        const isAlive = this.getLastGenCell().value;
        const neighboursAlive = this.countNeighboursAlive();
        if (isAlive) {
          if (neighboursAlive < 2 || neighboursAlive > 3) {
            this.killCell();
            didChange = true;
          }
        } else {
          if (neighboursAlive === 3) {
            this.enlivenCell();
            didChange = true;
          }
        }
        this.cursor.x++;
      }
      this.cursor.x = 0;
      this.cursor.y++;
    }
    if (didChange) this.eventManager?.emitGridUpdated();
    didChange = false;
  }

  private generationDidNotChange() {
    return this.grid.isEqual(this.gridHistory.lookback().grid);
  }

  private step(): GameStates | null {
    if (this.gridHistory.getLength() && this.generationDidNotChange()) {
      this.gridHistory.pop();

      if (this.getPopulation() > 0) {
        return GameStatesEnum.GAME_ENDED_WITH_POPULATION;
      }

      return GameStatesEnum.GAME_ENDED;
    }

    this.parseLastGeneration();
    return null;
  }

  private async runLoop() {
    while (this.getState() === GameStatesEnum.GAME_RUNNING) {
      const result = this.step();

      if (result !== null) {
        this.setState(result);
        return;
      }

      await sleep(this.delay);
    }
  }

  async toggleRun() {
    if (this.getState() === GameStatesEnum.GAME_RUNNING) {
      this.setState(GameStatesEnum.GAME_READY);
      return;
    }

    this.setState(GameStatesEnum.GAME_RUNNING);
    await this.runLoop();
  }

  changeDelay(n: number) {
    this.delay = n * 100;
  }

  nextGrid() {
    this.parseLastGeneration();
    if (this.generationDidNotChange()) {
      this.gridHistory.pop();
      this.eventManager?.emitGameStateChanged(GameStatesEnum.GAME_ENDED);
    }
  }

  previousGrid() {
    if (this.getHistoryLength() < 1)
      throw Error("there's no entries in grid history");
    this.resetCursor();
    this.resetPopulation();
    const lastHistEntry = this.gridHistory.pop();
    const { width, height } = this.grid.getDimensions();
    while (this.cursor.y < height) {
      while (this.cursor.x < width) {
        if (lastHistEntry.grid.getAtWithMetadata(this.cursor).value)
          this.enlivenCell(this.cursor);
        else this.killCell(this.cursor);
        this.cursor.x++;
      }
      this.cursor.x = 0;
      this.cursor.y++;
    }
    this.population = lastHistEntry.population;
    this.eventManager?.emitGridUpdated();
    this.eventManager?.emitGameStateChanged(GameStatesEnum.GAME_READY);
  }

  reset() {
    this.gridHistory = new GridHistory();
    this.resetPopulation();
    this.setState(GameStatesEnum.GAME_IDLE);
    if (this.latestOpts.grid instanceof Grid) this.grid = this.latestOpts.grid;
    else
      this.grid = new Grid({
        height: this.latestOpts.grid.height,
        width: this.latestOpts.grid.width,
      });
    this.eventManager?.emitGridReseted();
  }
  changeGridDimensions(dimensions: GridDimensions) {
    this.grid.changeDimensions(dimensions);
    const aliveCellsCount = this.getAliveCells().length;
    this.population = aliveCellsCount;
    if (aliveCellsCount < 1) this.setState(GameStatesEnum.GAME_IDLE);
  }

  resetCursor() {
    this.cursor = { y: 0, x: 0 };
  }
  resetPopulation() {
    this.population = 0;
  }

  getAliveCells() {
    const { height, width } = this.grid.getDimensions();
    const grid = this.getGrid();
    const coordinates: Coordinates[] = [];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (grid.getAtWithMetadata({ y, x }).value) {
          coordinates.push({ y, x });
        }
      }
    }
    return coordinates;
  }
}
