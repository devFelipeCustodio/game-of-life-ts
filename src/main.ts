import { Game } from './game';
import { GameEventManager, GameEventsEnum } from './gameEventsManager';

const game = new Game({ grid: { width: 5, height: 5 }, events: true });
const eventManager = new GameEventManager();
eventManager.on(
  [
    GameEventsEnum.GAME_STARTED,
    GameEventsEnum.GRID_UPDATED,
    GameEventsEnum.CELL_BORN,
    GameEventsEnum.CELL_KILLED,
  ],
  (event: CustomEvent) => {
    console.log(event.type, event.detail);
  }
);
game.toggleCell({ x: 0, y: 0 });
game.toggleCell({ x: 0, y: 1 });
game.toggleCell({ x: 0, y: 2 });
game.toggleCell({ x: 1, y: 2 });
