import { describe, expect, vi, test } from 'vitest';
import { EventManager, EventsEnum } from '../core/eventManager';

describe('EventManager', () => {
  test('handles multiple event subscriptions', () => {
    const manager = new EventManager();

    const cb = vi.fn();

    manager.on([EventsEnum.GRID_RESIZED, EventsEnum.CELL_TOGGLED], cb);

    window.dispatchEvent(new CustomEvent(EventsEnum.GRID_RESIZED));
    window.dispatchEvent(new CustomEvent(EventsEnum.CELL_TOGGLED));

    expect(cb).toHaveBeenCalledTimes(2);
    expect(cb.mock.calls.map((c) => c[0].type)).toEqual([
      EventsEnum.GRID_RESIZED,
      EventsEnum.CELL_TOGGLED,
    ]);
  });

  test('emits GRID_RESIZED event', () => {
    const manager = new EventManager();

    const listener = vi.fn();
    window.addEventListener(EventsEnum.GRID_RESIZED, listener);

    manager.emitGridResized();

    expect(listener).toHaveBeenCalledTimes(1);

    const event = listener.mock.calls[0][0] as CustomEvent;

    expect(event.type).toBe(EventsEnum.GRID_RESIZED);
  });

  test('emits CELL_TOGGLED event with coordinates', () => {
    const manager = new EventManager();

    const listener = vi.fn();
    window.addEventListener(EventsEnum.CELL_TOGGLED, listener);

    const coords = { x: 2, y: 3 };

    manager.emitCellToggled(coords);

    expect(listener).toHaveBeenCalledTimes(1);

    const event = listener.mock.calls[0][0] as CustomEvent;

    expect(event.type).toBe(EventsEnum.CELL_TOGGLED);
    expect(event.detail).toEqual(coords);
  });
});
