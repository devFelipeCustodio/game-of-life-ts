import { Game, GameStatesEnum } from './game';
import { GameEventsEnum } from './gameEventsManager';
import { Coordinates } from './grid';

const GRID_MARGIN_X = 3;
const GRID_MARGIN_Y = 1;
const CELL_SIZE = 20;

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

function debounce<T extends (...args: unknown[]) => void>(
  wait: number,
  callback: T
) {
  let timeout: ReturnType<typeof setTimeout> | null;

  return function <U>(this: U, ...args: Parameters<typeof callback>) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const context = this;

    if (typeof timeout === 'number') {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      timeout = null;
      callback.apply(context, args);
    }, wait);

    if (!timeout) {
      callback.apply(context, args);
    }
  };
}

function setupCanvases(
  canvasContainer: HTMLDivElement,
  bgCanvas: HTMLCanvasElement,
  gameCanvas: HTMLCanvasElement
) {
  const canvasClientRect = canvasContainer.getBoundingClientRect();

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
}

setupCanvases(canvasContainer, bgCanvas, gameCanvas);

const bgCtx = bgCanvas.getContext('2d');
const gameCtx = gameCanvas.getContext('2d');

if (!bgCtx || !gameCtx) throw Error();

function calculateGridDimensions(bgCanvas: HTMLCanvasElement) {
  return {
    height: Math.floor(bgCanvas.clientHeight / CELL_SIZE),
    width: Math.floor(bgCanvas.clientWidth / CELL_SIZE),
  };
}

const game = new Game({
  grid: calculateGridDimensions(bgCanvas),
  events: true,
  delay: 10 - parseInt(speedSlider.value),
});

function drawBackgroundCanvas(
  bgCanvas: HTMLCanvasElement,
  bgCtx: CanvasRenderingContext2D
) {
  for (let y = 0; y < calculateGridDimensions(bgCanvas).height; y++) {
    for (let x = 0; x < calculateGridDimensions(bgCanvas).width; x++) {
      bgCtx.strokeStyle = '#dee2e610';
      bgCtx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    }
  }
}

drawBackgroundCanvas(bgCanvas, bgCtx);

gameCanvas.addEventListener('click', (event) => {
  const rect = gameCanvas.getBoundingClientRect();

  const y = Math.floor((event.clientY - rect.top) / CELL_SIZE);
  const x = Math.floor((event.clientX - rect.left) / CELL_SIZE);

  game.eventManager?.emitCellToggled({
    y,
    x,
  });
});

window.addEventListener('resize', () => {
  game.eventManager?.emitGridResized();
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

speedSlider.addEventListener(
  'change',
  debounce(300, () => game.changeDelay(10 - parseInt(speedSlider.value)))
);

btnNext.addEventListener('click', () => game.nextGrid());
btnPrev.addEventListener('click', () => game.previousGrid());

game.eventManager?.on(GameEventsEnum.GRID_RESETED, () => {
  for (let y = 0; y < calculateGridDimensions(bgCanvas).height; y++) {
    for (let x = 0; x < calculateGridDimensions(bgCanvas).width; x++) {
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
      btnNext.setAttribute('disabled', 'true');
      btnPrev.removeAttribute('disabled');
      if (game.getPopulation() > 0) btnClear.removeAttribute('disabled');
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
  const populationCount = game.getPopulation();
  population.textContent = populationCount.toString();
  generation.textContent = (game.getHistoryLength() + 1).toString();
});

game.eventManager?.on(
  GameEventsEnum.GRID_RESIZED,
  debounce(100, () => {
    handleGridResize(canvasContainer, bgCanvas, gameCanvas, bgCtx, gameCtx);
  })
);

function handleGridResize(
  canvasContainer: HTMLDivElement,
  bgCanvas: HTMLCanvasElement,
  gameCanvas: HTMLCanvasElement,
  bgCtx: CanvasRenderingContext2D,
  gameCtx: CanvasRenderingContext2D
) {
  setupCanvases(canvasContainer, bgCanvas, gameCanvas);
  drawBackgroundCanvas(bgCanvas, bgCtx);
  const { height, width } = calculateGridDimensions(bgCanvas);
  game.changeGridDimensions({ height, width });
  const grid = game.getGrid();
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (grid.getAtWithMetadata({ y, x }).value) {
        gameCtx.fillStyle = '#0d6efd';
        gameCtx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }
  }
}

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
