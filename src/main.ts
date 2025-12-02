import { Game, GameStatesEnum } from './game';
import { GameEventsEnum } from './gameEventsManager';
import { Coordinates } from './grid';

const canvasContainer =
  document.querySelector<HTMLDivElement>('#canvasContainer');
if (!canvasContainer) throw Error();

const bgCanvas = document.querySelector<HTMLCanvasElement>('#bgCanvas');
const gameCanvas = document.querySelector<HTMLCanvasElement>('#gameCanvas');
const population = document.querySelector<HTMLSpanElement>('#populationCount');
const generation = document.querySelector<HTMLSpanElement>('#genCount');
const btnToggleRun = document.querySelector<HTMLButtonElement>('#btnToggleRun');
const btnClear = document.querySelector<HTMLButtonElement>('#btnClear');
const btnPrev = document.querySelector<HTMLButtonElement>('#btnPrev');
const btnNext = document.querySelector<HTMLButtonElement>('#btnNext');
const speedSlider = document.querySelector<HTMLInputElement>('#speedSlider');
if (
  !gameCanvas ||
  !bgCanvas ||
  !population ||
  !generation ||
  !btnToggleRun ||
  !speedSlider ||
  !btnClear ||
  !btnPrev ||
  !btnNext
)
  throw Error();

const canvasClientRect = canvasContainer.getBoundingClientRect();

const GRID_MARGIN_X = 3;
const GRID_MARGIN_Y = 1;
const CELL_SIZE = 20;

const canvasWidth =
  Math.floor(canvasClientRect.width / CELL_SIZE) * CELL_SIZE -
  CELL_SIZE * GRID_MARGIN_X;
const canvasHeight =
  Math.floor(canvasClientRect.height / CELL_SIZE) * CELL_SIZE -
  CELL_SIZE * GRID_MARGIN_Y;

bgCanvas.width = canvasWidth;
bgCanvas.height = canvasHeight;
gameCanvas.width = canvasWidth;
gameCanvas.height = canvasHeight;

const canvasMarginInline = (canvasClientRect.width - canvasWidth) / 2;
const canvasMarginBlock = (canvasClientRect.height - canvasHeight) / 2;

bgCanvas.style.marginInline = canvasMarginInline + 'px';
bgCanvas.style.marginBlock = canvasMarginBlock + 'px';
gameCanvas.style.marginInline = canvasMarginInline + 'px';
gameCanvas.style.marginBlock = canvasMarginBlock + 'px';

const bgCtx = bgCanvas.getContext('2d');
const gameCtx = gameCanvas.getContext('2d');

if (!bgCtx || !gameCtx) throw Error();

const gridDimensions = {
  height: Math.floor(bgCanvas.clientHeight / CELL_SIZE),
  width: Math.floor(bgCanvas.clientWidth / CELL_SIZE),
};

const game = new Game({
  grid: gridDimensions,
  events: true,
  delay: 10 - parseInt(speedSlider.value),
});

for (let y = 0; y < gridDimensions.height; y++) {
  for (let x = 0; x < gridDimensions.width; x++) {
    bgCtx.strokeStyle = '#dee2e610';
    bgCtx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
  }
}

gameCanvas.addEventListener('click', (event) => {
  const rect = gameCanvas.getBoundingClientRect();

  console.log(rect);

  const y = Math.floor((event.clientY - rect.top) / CELL_SIZE);
  const x = Math.floor((event.clientX - rect.left) / CELL_SIZE);

  game.eventManager?.emitCellToggled({
    y,
    x,
  });
});

window.addEventListener('resize', (event) => {
  console.log('resize');
  console.log(event);
});

btnToggleRun.addEventListener('click', (event) => {
  const pointerEvent = event as PointerEvent;
  const target = pointerEvent.target as HTMLElement | null;
  if (!target) throw Error();
  game.toggleRun();
});

btnClear.addEventListener('click', () => {
  game.reset();
});

speedSlider.addEventListener('change', () => {
  game.changeDelay(10 - parseInt(speedSlider.value));
});

btnNext.addEventListener('click', () => game.nextGrid());
btnPrev.addEventListener('click', () => game.previousGrid());

game.eventManager?.on(GameEventsEnum.GRID_RESETED, () => {
  for (let y = 0; y < gridDimensions.height; y++) {
    for (let x = 0; x < gridDimensions.width; x++) {
      gameCtx.clearRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    }
  }
  btnToggleRun.setAttribute('disabled', 'true');
  btnClear.setAttribute('disabled', 'true');
  btnPrev.setAttribute('disabled', 'true');
  btnNext.setAttribute('disabled', 'true');
  speedSlider.setAttribute('disabled', 'true');
  btnToggleRun.textContent = 'Iniciar';
  population.textContent = game.getPopulation().toString();
  generation.textContent = game.getPopulation().toString();
});

game.eventManager?.on(GameEventsEnum.GAME_STATE_CHANGED, (event) => {
  switch (event.detail) {
    case GameStatesEnum.GAME_RUNNING:
      btnClear.setAttribute('disabled', 'true');
      btnPrev.setAttribute('disabled', 'true');
      btnNext.setAttribute('disabled', 'true');
      btnToggleRun.textContent = 'Parar';
      break;
    case GameStatesEnum.GAME_IDLE:
      btnClear.setAttribute('disabled', 'true');
      btnNext.setAttribute('disabled', 'true');
      speedSlider.setAttribute('disabled', 'true');
      btnToggleRun.textContent = 'Iniciar';
      btnToggleRun.setAttribute('disabled', 'true');
      break;

    case GameStatesEnum.GAME_READY:
      btnToggleRun.removeAttribute('disabled');
      btnToggleRun.textContent = 'Iniciar';
      btnClear.removeAttribute('disabled');
      btnNext.removeAttribute('disabled');
      speedSlider.removeAttribute('disabled');
      break;

    case GameStatesEnum.GAME_ENDED:
      btnToggleRun.setAttribute('disabled', 'true');
      btnToggleRun.textContent = 'Iniciar';
      speedSlider.setAttribute('disabled', 'true');
      btnClear.removeAttribute('disabled');
      btnNext.setAttribute('disabled', 'true');
      btnPrev.removeAttribute('disabled');
      break;
  }
});

game.eventManager?.on(
  GameEventsEnum.CELL_TOGGLED,
  (event: CustomEvent<Coordinates>) => {
    game.toggleCell(event.detail);
    population.textContent = game.getPopulation().toString();
  }
);

game.eventManager?.on(GameEventsEnum.GRID_UPDATED, () => {
  if (game.getState() !== GameStatesEnum.GAME_RUNNING) {
    btnNext.removeAttribute('disabled');
    if (game.getHistoryLength() < 1) btnPrev.setAttribute('disabled', 'true');
    else btnPrev.removeAttribute('disabled');
  }
  population.textContent = game.getPopulation().toString();
  generation.textContent = (game.getHistoryLength() + 1).toString();
});

game.eventManager?.on(
  GameEventsEnum.CELL_BORN,
  (event: CustomEvent<Coordinates>) => {
    gameCtx.fillStyle = '#0d6efd';
    gameCtx.fillRect(
      event.detail.x * CELL_SIZE,
      event.detail.y * CELL_SIZE,
      CELL_SIZE,
      CELL_SIZE
    );
  }
);

game.eventManager?.on(
  GameEventsEnum.CELL_KILLED,
  (event: CustomEvent<Coordinates>) => {
    gameCtx.clearRect(
      event.detail.x * CELL_SIZE,
      event.detail.y * CELL_SIZE,
      CELL_SIZE,
      CELL_SIZE
    );
  }
);
