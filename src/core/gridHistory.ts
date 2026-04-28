import { Grid } from './grid';

type GridHistoryEntry = {
  grid: Grid;
  population: number;
};

export class GridHistory {
  private stack: GridHistoryEntry[] = [];
  private length = 0;

  push(entry: GridHistoryEntry) {
    this.stack.push(entry);
    this.length++;
  }

  lookback() {
    return this.stack[this.length - 1];
  }

  pop() {
    const last = this.stack.pop();
    if (!last) throw Error('history stack is empty');
    this.length--;
    return last;
  }

  getLength() {
    return this.length;
  }
}
