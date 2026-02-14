import { describe, it, expect } from 'vitest';
import { DropIndicator } from '../DropIndicator';

describe('DropIndicator', () => {
  it('starts hidden', () => {
    const indicator = new DropIndicator();
    expect(indicator.getElement().style.display).toBe('none');
  });

  it('becomes visible when show() is called', () => {
    const indicator = new DropIndicator();
    const columnEl = document.createElement('div');
    indicator.show(100, columnEl);
    expect(indicator.getElement().style.display).toBe('block');
  });

  it('positions at the given y coordinate', () => {
    const indicator = new DropIndicator();
    const columnEl = document.createElement('div');
    indicator.show(150, columnEl);
    expect(indicator.getElement().style.top).toBe('150px');
  });

  it('appends itself to the provided column element', () => {
    const indicator = new DropIndicator();
    const columnEl = document.createElement('div');
    indicator.show(100, columnEl);
    expect(columnEl.contains(indicator.getElement())).toBe(true);
  });

  it('moves to a different column on subsequent show() calls', () => {
    const indicator = new DropIndicator();
    const col1 = document.createElement('div');
    const col2 = document.createElement('div');

    indicator.show(50, col1);
    expect(col1.contains(indicator.getElement())).toBe(true);

    indicator.show(80, col2);
    expect(col2.contains(indicator.getElement())).toBe(true);
    expect(col1.contains(indicator.getElement())).toBe(false);
  });

  it('hides when hide() is called', () => {
    const indicator = new DropIndicator();
    const columnEl = document.createElement('div');
    indicator.show(100, columnEl);
    indicator.hide();
    expect(indicator.getElement().style.display).toBe('none');
  });
});
