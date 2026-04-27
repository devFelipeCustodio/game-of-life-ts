import { expect, test, describe } from 'vitest';
import { GridHistory } from '../core/gridHistory';
import { Grid } from '../core/grid';

describe('GridHistory', () => {
  test('stores multiple history entries', () => {
    const history = new GridHistory();

    const gridA = new Grid({ height: 3, width: 3 });
    history.push({ grid: gridA, population: 0 });

    const gridB = new Grid({ height: 3, width: 3 });
    gridB.enableAt({ x: 0, y: 0 });

    history.push({ grid: gridB, population: 1 });

    expect(history.getLength()).toBe(2);
  });

  test('returns last history entry', () => {
    const history = new GridHistory();

    const grid = new Grid({ height: 3, width: 3 });

    history.push({ grid, population: 0 });

    const last = history.lookback();

    expect(last.population).toBe(0);

    expect(last.grid.getMatrix()).toEqual([
      new Uint8Array([0, 0, 0]),
      new Uint8Array([0, 0, 0]),
      new Uint8Array([0, 0, 0]),
    ]);
  });

  test('pops last entry and returns it', () => {
    const history = new GridHistory();

    const gridA = new Grid({ height: 3, width: 3 });
    history.push({ grid: gridA, population: 0 });

    const gridB = new Grid({ height: 3, width: 3 });
    gridB.enableAt({ x: 0, y: 0 });

    history.push({ grid: gridB, population: 1 });

    const last = history.pop();

    expect(last.population).toBe(1);
    expect(last.grid).toBe(gridB);
    expect(history.getLength()).toBe(1);
  });

  test('throws when popping empty history', () => {
    const history = new GridHistory();

    expect(() => history.pop()).toThrow('history stack is empty');
  });
});
