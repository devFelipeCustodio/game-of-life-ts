import { GameStates } from './game';
import { Coordinates } from './grid';

export const GameEventsEnum = {
  GAME_STATE_CHANGED: 'gameOfLife_gameStateChanged',
  GRID_CREATED: 'gameOfLife_gridCreated',
  GRID_UPDATED: 'gameOfLife_gridUpdated',
  GRID_RESETED: 'gameOfLife_gridReseted',
  GRID_RESIZED: 'gameOfLife_gridResized',
  CELL_BORN: 'gameOfLife_cellBorn',
  CELL_TOGGLED: 'gameOfLife_cellToggled',
  CELL_KILLED: 'gameOfLife_cellKilled',
} as const;

export type GameEvents =
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

  emitGridUpdated() {
    const event = new CustomEvent(GameEventsEnum.GRID_UPDATED);
    window.dispatchEvent(event);
  }

  emitGridReseted() {
    const event = new CustomEvent(GameEventsEnum.GRID_RESETED);
    window.dispatchEvent(event);
  }

  emitGridResized() {
    const event = new CustomEvent(GameEventsEnum.GRID_RESIZED);
    window.dispatchEvent(event);
  }

  emitGameStateChanged(state: GameStates) {
    const event = new CustomEvent(GameEventsEnum.GAME_STATE_CHANGED, {
      detail: state,
    });
    window.dispatchEvent(event);
  }

  emitCellToggled(coordinates: Coordinates) {
    const event = new CustomEvent(GameEventsEnum.CELL_TOGGLED, {
      detail: coordinates,
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
