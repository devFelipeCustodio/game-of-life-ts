import { GameEventManager } from './gameEventsManager';
import { Coordinates, Grid, GridDimensions } from './grid';
import { GridHistory } from './gridHistory';

type GameOptions = {
  grid: GridDimensions | Grid;
  gridHistory?: GridHistory;
  events?: boolean | GameEventManager;
};

export class Game {
  private running = false;
  private grid: Grid;
  private events: GameEventManager | undefined;
  private gridHistory: GridHistory;
  private cursor: Coordinates = { y: 0, x: 0 };

  constructor(opts: GameOptions) {
    if (opts.grid instanceof Grid) this.grid = opts.grid;
    else
      this.grid = new Grid({
        height: opts.grid.height,
        width: opts.grid.width,
      });
    if (opts.events) this.events = new GameEventManager();
    if (!opts.gridHistory) this.gridHistory = new GridHistory();
    else this.gridHistory = opts.gridHistory;
  }

  toggleCell(coords: Coordinates) {
    const isAlive = this.grid.toggleAt(coords);
    if (isAlive) this.events?.emitCellBorn(coords);
    else this.events?.emitCellKilled(coords);
  }

  private enlivenCell() {
    this.grid.enableAt(this.cursor);
    this.events?.emitCellBorn(this.cursor);
  }

  private killCell() {
    this.grid.disableAt(this.cursor);
    this.events?.emitCellKilled(this.cursor);
  }

  private getLastGenCellAt(coords: Coordinates) {
    const lastGen = this.gridHistory.lookback();
    return lastGen.getAtWithMetadata(coords);
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
    this.cursor = { y: 0, x: 0 };
    this.gridHistory.push(this.cloneCurrentGridInstance());
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
    if (didChange)
      this.events?.emitGridUpdated(this.cloneCurrentGridInstance());
    didChange = false;
  }

  private generationDidNotChange() {
    return this.grid.isEqual(this.gridHistory.lookback());
  }

  toggleRun() {
    if (!this.running) {
      this.running = true;
      this.events?.emitGameStarted(this.cloneCurrentGridInstance());
      while (this.running) {
        this.parseLastGeneration();
        if (this.gridHistory.getLength() && this.generationDidNotChange())
          this.running = false;
      }
    } else {
      this.running = false;
    }
  }
}
