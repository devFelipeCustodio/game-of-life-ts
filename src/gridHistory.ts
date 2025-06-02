import { Grid } from './grid';

export class GridHistory {
  private stack: Grid[] = [];
  private length = 0;

  push(grid: Grid) {
    this.stack.push(grid);
    this.length++;
  }

  clear() {
    this.stack = [];
  }

  lookback() {
    return this.stack[this.length - 1];
  }

  pop() {
    const last = this.stack.pop();
    if (!last) throw Error('history stack is empty');
    return last;
  }

  getLength() {
    return this.length;
  }
}
