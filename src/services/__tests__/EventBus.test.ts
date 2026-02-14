import { describe, it, expect, vi } from 'vitest';
import { EventBus } from '../EventBus';

describe('EventBus', () => {
  describe('on/emit', () => {
    it('calls a registered callback when the event is emitted', () => {
      const bus = new EventBus();
      const callback = vi.fn();

      bus.on('test', callback);
      bus.emit('test', 'arg1', 42);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith('arg1', 42);
    });

    it('supports multiple arguments', () => {
      const bus = new EventBus();
      const callback = vi.fn();

      bus.on('test', callback);
      bus.emit('test', 'a', 'b', 'c');

      expect(callback).toHaveBeenCalledWith('a', 'b', 'c');
    });
  });

  describe('off', () => {
    it('unregisters a callback so it is no longer called', () => {
      const bus = new EventBus();
      const callback = vi.fn();

      bus.on('test', callback);
      bus.off('test', callback);
      bus.emit('test');

      expect(callback).not.toHaveBeenCalled();
    });

    it('does not affect other callbacks on the same event', () => {
      const bus = new EventBus();
      const cb1 = vi.fn();
      const cb2 = vi.fn();

      bus.on('test', cb1);
      bus.on('test', cb2);
      bus.off('test', cb1);
      bus.emit('test');

      expect(cb1).not.toHaveBeenCalled();
      expect(cb2).toHaveBeenCalledTimes(1);
    });
  });

  describe('multiple listeners', () => {
    it('calls all registered callbacks for the same event', () => {
      const bus = new EventBus();
      const cb1 = vi.fn();
      const cb2 = vi.fn();

      bus.on('test', cb1);
      bus.on('test', cb2);
      bus.emit('test', 'data');

      expect(cb1).toHaveBeenCalledTimes(1);
      expect(cb2).toHaveBeenCalledTimes(1);
    });
  });

  describe('no listeners', () => {
    it('does not throw when emitting an event with no listeners', () => {
      const bus = new EventBus();
      expect(() => bus.emit('nonexistent', 'data')).not.toThrow();
    });
  });

  describe('separate events', () => {
    it('does not call callbacks registered on a different event', () => {
      const bus = new EventBus();
      const callback = vi.fn();

      bus.on('eventA', callback);
      bus.emit('eventB');

      expect(callback).not.toHaveBeenCalled();
    });
  });
});
