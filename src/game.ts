import { GameEventManager } from './gameEventsManager';
import { Coordinates, Grid, GridDimensions } from './grid';
import { GridHistory } from './gridHistory';

type GameOptions = {
  grid: GridDimensions | Grid;
  gridHistory?: GridHistory;
  events?: boolean | GameEventManager;
  delay?: number;
};

export const GameStatesEnum = {
  GAME_IDLE: 'gameOfLife_gameIdle',
  GAME_READY: 'gameOfLife_gameReady',
  GAME_RUNNING: 'gameOfLife_gameRunning',
  GAME_ENDED: 'gameOfLife_gameEnded',
} as const;

export type GameStates = (typeof GameStatesEnum)[keyof typeof GameStatesEnum];

export class Game {
  eventManager: GameEventManager | undefined;
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
    if (opts.events) this.eventManager = new GameEventManager();
    if (!opts.gridHistory) this.gridHistory = new GridHistory();
    else this.gridHistory = opts.gridHistory;
  }

  getGrid() {
    return this.grid;
  }

  getState() {
    return this.state;
  }

  setState(state: GameStates) {
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

  private async sleep(t: number) {
    return await new Promise((resolve) => setTimeout(resolve, t));
  }

  async toggleRun() {
    if (this.getState() !== GameStatesEnum.GAME_RUNNING) {
      this.setState(GameStatesEnum.GAME_RUNNING);
      while (this.getState() === GameStatesEnum.GAME_RUNNING) {
        if (this.gridHistory.getLength() && this.generationDidNotChange()) {
          this.gridHistory.pop();
          this.setState(GameStatesEnum.GAME_ENDED);
          return;
        }
        this.parseLastGeneration();
        await this.sleep(this.delay);
      }
    } else {
      this.setState(GameStatesEnum.GAME_READY);
    }
  }

  changeDelay(n: number) {
    this.delay = n * 100;
  }

  nextGrid() {
    this.parseLastGeneration();
    if (this.grid.isEqual(this.gridHistory.lookback().grid)) {
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
    if (this.latestOpts.events) this.eventManager = new GameEventManager();
    this.eventManager?.emitGridReseted();
  }
  changeGridDimensions(dimensions: GridDimensions) {
    this.grid.changeDimensions(dimensions);
  }
  resetCursor() {
    this.cursor = { y: 0, x: 0 };
  }
  resetPopulation() {
    this.population = 0;
  }
}
