export type GridDimensions = { height: number; width: number };
export type Coordinates = { y: number; x: number };

export type Block = {
  value: number | undefined;
  neighbours: {
    topLeft: Block['value'];
    top: Block['value'];
    topRight: Block['value'];
    left: Block['value'];
    right: Block['value'];
    bottomLeft: Block['value'];
    bottom: Block['value'];
    bottomRight: Block['value'];
  };
};

export class Grid {
  private matrix: Array<Uint8Array>;
  private dimensions: GridDimensions;

  constructor({ height, width }: GridDimensions) {
    this.matrix = Array.from({ length: height }, () => new Uint8Array(height));
    this.dimensions = { height, width };
  }

  toggleAt({ y, x }: Coordinates) {
    const block = this.getAt({ y, x });
    if (block === undefined) return;
    this.matrix[y][x] = block ^ 1;
    return this.matrix[y][x];
  }

  enableAt({ y, x }: Coordinates) {
    const block = this.getAt({ y, x });
    if (block === undefined) return;
    this.matrix[y][x] = 1;
  }

  disableAt({ y, x }: Coordinates) {
    const block = this.getAt({ y, x });
    if (block === undefined) return;
    this.matrix[y][x] = 0;
  }

  getDimensions() {
    return this.dimensions;
  }

  private getAt({ y, x }: Coordinates) {
    if (
      y < 0 ||
      x < 0 ||
      y >= this.dimensions.height ||
      x >= this.dimensions.width
    )
      return undefined;
    return this.matrix[y][x];
  }

  getAtWithMetadata({ y, x }: Coordinates): Block {
    return {
      value: this.getAt({ y, x }),
      neighbours: {
        topLeft: this.getAt({ y: y - 1, x: x - 1 }) ?? 0,
        top: this.getAt({ y: y - 1, x }) ?? 0,
        topRight: this.getAt({ y: y - 1, x: x + 1 }) ?? 0,
        left: this.getAt({ y, x: x - 1 }) ?? 0,
        right: this.getAt({ y, x: x + 1 }) ?? 0,
        bottomLeft: this.getAt({ y: y + 1, x: x - 1 }) ?? 0,
        bottom: this.getAt({ y: y + 1, x }) ?? 0,
        bottomRight: this.getAt({ y: y + 1, x: x + 1 }) ?? 0,
      },
    };
  }

  isEqual(target: Grid) {
    return this.matrix.toString() === target.matrix.toString();
  }
}
