import { GameStates, GameStatesEnum } from '../core/game';
import { debounce } from '../util';
import { UIController } from './controller';

export class Elements {
  readonly btnToggleRun: HTMLButtonElement;
  readonly btnClear: HTMLButtonElement;
  readonly population: HTMLSpanElement;
  readonly generation: HTMLSpanElement;
  readonly btnPrev: HTMLButtonElement;
  readonly btnNext: HTMLButtonElement;
  readonly speedSlider: HTMLInputElement;
  constructor(private controller: UIController) {
    this.btnToggleRun = this.getBtnToggleRun();
    this.btnClear = this.getBtnClear();
    this.population = this.getPopulation();
    this.generation = this.getGeneration();
    this.btnPrev = this.getBtnPrev();
    this.btnNext = this.getBtnNext();
    this.speedSlider = this.getSpeedSlider();
    this.subscribeToEvents();
  }

  getBtnToggleRun() {
    const el = document.querySelector<HTMLButtonElement>('#btnToggleRun');
    if (!el) throw Error();
    return el;
  }
  getBtnClear() {
    const el = document.querySelector<HTMLButtonElement>('#btnClear');
    if (!el) throw Error();
    return el;
  }
  getPopulation() {
    const el = document.querySelector<HTMLSpanElement>('#populationCount');
    if (!el) throw Error();
    return el;
  }
  getGeneration() {
    const el = document.querySelector<HTMLSpanElement>('#genCount');
    if (!el) throw Error();
    return el;
  }

  getBtnPrev() {
    const el = document.querySelector<HTMLButtonElement>('#btnPrev');
    if (!el) throw Error();
    return el;
  }
  getBtnNext() {
    const el = document.querySelector<HTMLButtonElement>('#btnNext');
    if (!el) throw Error();
    return el;
  }
  getSpeedSlider() {
    const el = document.querySelector<HTMLInputElement>('#speedSlider');
    if (!el) throw Error();
    return el;
  }

  enablePrev() {
    this.btnPrev.removeAttribute('disabled');
  }
  disablePrev() {
    this.btnPrev.setAttribute('disabled', 'true');
  }

  enableNext() {
    this.btnNext.removeAttribute('disabled');
  }
  disableNext() {
    this.btnNext.setAttribute('disabled', 'true');
  }

  setPopulation(count: number) {
    this.population.textContent = count.toString();
  }

  setGeneration(count: number) {
    this.generation.textContent = count.toString();
  }

  setState(state: GameStates) {
    switch (state) {
      case GameStatesEnum.GAME_RUNNING:
        this.btnClear.setAttribute('disabled', 'true');
        this.btnNext.setAttribute('disabled', 'true');
        this.btnToggleRun.textContent = 'Parar';
        break;

      case GameStatesEnum.GAME_READY:
        this.btnToggleRun.removeAttribute('disabled');
        this.btnClear.removeAttribute('disabled');
        this.btnNext.removeAttribute('disabled');
        this.speedSlider.removeAttribute('disabled');
        this.btnToggleRun.textContent = 'Iniciar';
        break;

      case GameStatesEnum.GAME_IDLE:
        this.btnClear.setAttribute('disabled', 'true');
        this.btnNext.setAttribute('disabled', 'true');
        this.speedSlider.setAttribute('disabled', 'true');
        this.btnToggleRun.setAttribute('disabled', 'true');
        this.btnToggleRun.textContent = 'Iniciar';
        break;

      case GameStatesEnum.GAME_ENDED:
        this.btnToggleRun.setAttribute('disabled', 'true');
        this.speedSlider.setAttribute('disabled', 'true');
        this.btnNext.setAttribute('disabled', 'true');
        this.btnPrev.removeAttribute('disabled');
        this.btnToggleRun.textContent = 'Iniciar';
        break;

      case GameStatesEnum.GAME_ENDED_WITH_POPULATION:
        this.btnToggleRun.setAttribute('disabled', 'true');
        this.speedSlider.setAttribute('disabled', 'true');
        this.btnNext.setAttribute('disabled', 'true');
        this.btnPrev.removeAttribute('disabled');
        this.btnToggleRun.textContent = 'Iniciar';
        this.btnClear.removeAttribute('disabled');
        break;
    }
  }

  subscribeToEvents() {
    this.btnToggleRun.addEventListener('click', (event) => {
      const pointerEvent = event as PointerEvent;
      const target = pointerEvent.target as HTMLElement | null;
      if (!target) throw Error();
      this.controller.toggleRun();
    });

    this.btnClear.addEventListener('click', () => {
      this.controller.reset();
    });

    this.speedSlider.addEventListener(
      'change',
      debounce(300, () => this.controller.changeDelay()),
    );

    this.btnNext.addEventListener('click', () => this.controller.nextGrid());
    this.btnPrev.addEventListener('click', () =>
      this.controller.previousGrid(),
    );
  }
}
