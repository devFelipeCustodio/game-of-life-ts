import { expect, test, describe } from 'vitest';
import { Grid } from '../core/grid';

describe('Grid', () => {
  test('creates an empty grid', () => {
    const grid = new Grid({ height: 3, width: 3 });

    expect(grid.getDimensions()).toEqual({ height: 3, width: 3 });

    const matrix = grid.getMatrix();
    expect(matrix.length).toBe(3);
    expect(matrix.every((row) => [...row].every((v) => v === 0))).toBe(true);
  });

  test('resizes grid correctly', () => {
    const grid = new Grid({ height: 3, width: 3 });

    grid.changeDimensions({ height: 5, width: 4 });

    expect(grid.getDimensions()).toEqual({ height: 5, width: 4 });
    expect(grid.getMatrix().length).toBe(5);
    expect(grid.getMatrix()[0].length).toBe(4);

    grid.changeDimensions({ height: 2, width: 2 });

    expect(grid.getDimensions()).toEqual({ height: 2, width: 2 });
  });

  test('toggle flips cell state', () => {
    const grid = new Grid({ height: 3, width: 3 });

    grid.toggleAt({ x: 1, y: 1 });
    expect(grid.getAtWithMetadata({ x: 1, y: 1 }).value).toBe(1);

    grid.toggleAt({ x: 1, y: 1 });
    expect(grid.getAtWithMetadata({ x: 1, y: 1 }).value).toBe(0);
  });

  test('enable and disable work correctly', () => {
    const grid = new Grid({ height: 3, width: 3 });

    grid.enableAt({ x: 0, y: 0 });
    expect(grid.getAtWithMetadata({ x: 0, y: 0 }).value).toBe(1);

    grid.disableAt({ x: 0, y: 0 });
    expect(grid.getAtWithMetadata({ x: 0, y: 0 }).value).toBe(0);
  });

  test('operations outside bounds are ignored', () => {
    const grid = new Grid({ height: 3, width: 3 });

    expect(grid.toggleAt({ x: -1, y: -1 })).toBeUndefined();
    expect(grid.enableAt({ x: 10, y: 10 })).toBeUndefined();
    expect(grid.disableAt({ x: 10, y: 10 })).toBeUndefined();

    expect(grid.getAtWithMetadata({ x: 10, y: 10 }).value).toBeUndefined();
  });

  test('returns correct neighbour metadata', () => {
    const grid = new Grid({ height: 3, width: 3 });

    grid.enableAt({ x: 1, y: 0 });

    const cell = grid.getAtWithMetadata({ x: 1, y: 0 });

    expect(cell.value).toBe(1);

    expect(cell.neighbours).toEqual({
      topLeft: 0,
      top: 0,
      topRight: 0,
      left: 0,
      right: 0,
      bottomLeft: 0,
      bottom: 0,
      bottomRight: 0,
    });
  });

  test('compares grids correctly', () => {
    const gridA = new Grid({ height: 3, width: 3 });
    const gridB = new Grid({ height: 3, width: 3 });

    expect(gridA.isEqual(gridB)).toBe(true);

    gridA.enableAt({ x: 1, y: 0 });

    expect(gridA.isEqual(gridB)).toBe(false);

    gridB.enableAt({ x: 1, y: 0 });

    expect(gridA.isEqual(gridB)).toBe(true);
  });
});
