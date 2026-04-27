/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, test, vi } from 'vitest';
import { Game, GameStatesEnum } from '../core/game';
import { Grid } from '../core/grid';
import * as util from '../util';

describe('Game', () => {
  test('single cell dies (underpopulation)', () => {
    const game = new Game({ grid: { width: 3, height: 3 } });

    game.toggleCell({ x: 1, y: 1 });
    game.nextGrid();

    expect(game.getAliveCells()).toEqual([]);
  });

  test('cell survives with 2 neighbors', () => {
    const game = new Game({ grid: { width: 3, height: 3 } });

    game.toggleCell({ x: 1, y: 1 });
    game.toggleCell({ x: 1, y: 0 });
    game.toggleCell({ x: 1, y: 2 });

    game.nextGrid();

    expect(game.getAliveCells()).toEqual(
      expect.arrayContaining([{ x: 1, y: 1 }]),
    );
  });

  test('cell dies with overpopulation', () => {
    const game = new Game({ grid: { width: 3, height: 3 } });

    game.toggleCell({ x: 1, y: 1 });
    game.toggleCell({ x: 0, y: 1 });
    game.toggleCell({ x: 2, y: 1 });
    game.toggleCell({ x: 1, y: 0 });
    game.toggleCell({ x: 1, y: 2 });

    game.nextGrid();

    expect(game.getAliveCells()).not.toEqual(
      expect.arrayContaining([{ x: 1, y: 1 }]),
    );
  });

  test('dead cell becomes alive with exactly 3 neighbors', () => {
    const game = new Game({ grid: { width: 3, height: 3 } });

    game.toggleCell({ x: 0, y: 1 });
    game.toggleCell({ x: 1, y: 0 });
    game.toggleCell({ x: 2, y: 1 });

    game.nextGrid();

    expect(game.getAliveCells()).toEqual(
      expect.arrayContaining([{ x: 1, y: 1 }]),
    );
  });

  test('block pattern is stable', () => {
    const game = new Game({ grid: { width: 4, height: 4 } });

    const block = [
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
    ];

    block.forEach((c) => game.toggleCell(c));

    const before = game.getAliveCells();

    game.nextGrid();

    expect(game.getAliveCells()).toEqual(before);
  });

  test('L-shape evolves over generations', () => {
    const game = new Game({ grid: { width: 4, height: 4 } });

    [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
    ].forEach((c) => game.toggleCell(c));

    game.nextGrid();
    game.nextGrid();

    const alive = game.getAliveCells();

    expect(alive.length).toBeGreaterThan(0);
  });

  test('single cell ends the game loop', async () => {
    const game = new Game({ grid: { width: 3, height: 3 }, delay: 0 });

    game.toggleCell({ x: 1, y: 1 });

    vi.spyOn(util, 'sleep').mockResolvedValue(undefined);

    game.toggleRun();

    await Promise.resolve();
    await Promise.resolve();

    expect(game.getState()).toBe(GameStatesEnum.GAME_ENDED);
  });

  test('toggleRun stops a running game', async () => {
    const game = new Game({ grid: { width: 3, height: 3 } });

    (game as any).state = GameStatesEnum.GAME_RUNNING;

    await game.toggleRun();

    expect(game.getState()).toBe(GameStatesEnum.GAME_READY);
  });

  test('previousGrid restores previous state', () => {
    const game = new Game({
      grid: { width: 3, height: 3 },
      events: true,
    });

    game.toggleCell({ x: 1, y: 1 });

    game.nextGrid();
    game.previousGrid();

    expect(game.getPopulation()).toBe(1);
  });

  test('throws when previousGrid has no history', () => {
    const game = new Game({ grid: { width: 3, height: 3 } });

    expect(() => game.previousGrid()).toThrow();
  });

  test('reset clears grid and state', () => {
    const game = new Game({
      grid: { width: 3, height: 3 },
      events: true,
    });

    game.toggleCell({ x: 1, y: 1 });

    game.reset();

    expect(game.getPopulation()).toBe(0);
    expect(game.getState()).toBe(GameStatesEnum.GAME_IDLE);
    expect(game.getHistoryLength()).toBe(0);
  });

  test('reset preserves provided grid instance', () => {
    const grid = new Grid({ width: 3, height: 3 });

    const game = new Game({
      grid,
      events: true,
    });

    game.reset();

    expect(game.getGrid()).toBe(grid);
  });

  test('toggleCell flips state correctly', () => {
    const game = new Game({ grid: { width: 3, height: 3 } });

    game.toggleCell({ x: 0, y: 0 });
    expect(game.getAliveCells()).toContainEqual({ x: 0, y: 0 });

    game.toggleCell({ x: 0, y: 0 });
    expect(game.getAliveCells()).not.toContainEqual({ x: 0, y: 0 });
  });

  test('throws on out-of-bounds toggle', () => {
    const game = new Game({ grid: { width: 3, height: 3 } });

    expect(() => game.toggleCell({ x: 10, y: 10 })).toThrow();
  });

  test('resizing grid updates population correctly', () => {
    const game = new Game({ grid: { width: 3, height: 3 } });

    game.toggleCell({ x: 1, y: 1 });

    game.changeGridDimensions({ width: 5, height: 5 });

    expect(game.getPopulation()).toBe(1);

    game.toggleCell({ x: 4, y: 4 });

    game.changeGridDimensions({ width: 3, height: 3 });

    expect(game.getPopulation()).toBe(1);
  });

  test('emits GAME_ENDED_WITH_POPULATION for stable pattern', () => {
    const game = new Game({
      grid: { width: 4, height: 4 },
      events: true,
    });

    const spy = vi.spyOn(game.eventManager!, 'emitGameStateChanged');

    const block = [
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
    ];

    block.forEach((c) => game.toggleCell(c));

    (game as any).step(); 
    const result = (game as any).step();

    if (result !== null) {
      (game as any).setState(result);
    }

    expect(spy).toHaveBeenCalledWith(GameStatesEnum.GAME_ENDED_WITH_POPULATION);
  });
});
