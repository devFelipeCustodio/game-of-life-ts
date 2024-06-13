import '../style.css';
import { Game } from './game';

const canvas = document.querySelector<HTMLCanvasElement>('canvas')!;
const speedInput = document.querySelector<HTMLInputElement>('#range-speed')!;
const spanCurrGen = document.querySelector<HTMLSpanElement>('#span-curr-gen')!;
const spanPopulation =
    document.querySelector<HTMLSpanElement>('#span-population')!;
const btnStart = document.querySelector<HTMLButtonElement>('#btn-start')!;
const btnStop = document.querySelector<HTMLButtonElement>('#btn-stop')!;
const btnPrev = document.querySelector<HTMLButtonElement>('#btn-prev')!;
const btnNext = document.querySelector<HTMLButtonElement>('#btn-next')!;
const btnClear = document.querySelector<HTMLButtonElement>('#btn-clear')!;

new Game(
    canvas,
    speedInput,
    spanCurrGen,
    spanPopulation,
    btnStart,
    btnStop,
    btnPrev,
    btnNext,
    btnClear
);
