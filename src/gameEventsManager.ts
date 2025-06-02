import { Coordinates, Grid } from "./game";

export const GameEventsEnum = {
  GAME_STARTED: 'gameOfLife_gameStarted',
  GRID_CREATED: 'gameOfLife_gridCreated',
  GRID_UPDATED: 'gameOfLife_gridUpdated',
  CELL_BORN: 'gameOfLife_cellBorn',
  CELL_KILLED: 'gameOfLife_cellKilled',
} as const;

type GameEvents =
  | (typeof GameEventsEnum)[keyof typeof GameEventsEnum]
  | 'resize';

export class GameEventManager {
  private static instance: GameEventManager;
  constructor() {
    if (GameEventManager.instance) return GameEventManager.instance;
    GameEventManager.instance = this;
  }

  on(event: GameEvents | GameEvents[], cb: (event: CustomEvent) => unknown) {
    if (typeof event === 'object') {
      return event.forEach((e) => this.on(e, cb));
    }
    window.addEventListener(event, (evt) => cb(evt as CustomEvent));
  }

  emitGridUpdated(grid: Grid) {
    const event = new CustomEvent(GameEventsEnum.GRID_UPDATED, {
      detail: grid,
    });
    window.dispatchEvent(event);
  }

  emitGameStarted(grid: Grid) {
    const event = new CustomEvent(GameEventsEnum.GAME_STARTED, {
      detail: grid,
    });
    window.dispatchEvent(event);
  }

  emitCellBorn(coordinates: Coordinates) {
    const event = new CustomEvent(GameEventsEnum.CELL_BORN, {
      detail: coordinates,
    });
    window.dispatchEvent(event);
  }

  emitCellKilled(coordinates: Coordinates) {
    const event = new CustomEvent(GameEventsEnum.CELL_KILLED, {
      detail: coordinates,
    });
    window.dispatchEvent(event);
  }
}
