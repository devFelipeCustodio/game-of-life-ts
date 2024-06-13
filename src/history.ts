import { TCellStore } from "./grid";

export class History {
    private collection: Array<TCellStore> = [];
    constructor(private limit: number = 500) {
        this.limit = limit;
    }
    private isFull() {
        return this.collection.length >= this.limit;
    }
    isEmpty() {
        return this.collection.length < 1;
    }
    push(snapshot: TCellStore) {
        if (this.isFull()) {
            this.collection.splice(0, 1);
        }
        this.collection.push(structuredClone(snapshot));
    }

    pop() {
        if (!this.isEmpty()) return this.collection.pop();
    }

    peek() {
        if (!this.isEmpty()) return this.collection[this.collection.length - 1];
    }

    clear() {
        this.collection = [];
    }
}
