import { describe, it, expect } from 'vitest';
import { CanvasColumn } from '../CanvasColumn';

describe('CanvasColumn', () => {
  it('creates an element with the canvas-column class', () => {
    const column = new CanvasColumn(0);
    expect(column.getElement().className).toBe('canvas-column');
  });

  it('sets position: relative on the container', () => {
    const column = new CanvasColumn(0);
    expect(column.getElement().style.position).toBe('relative');
  });

  it('displays a header with the column number (1-indexed)', () => {
    const column = new CanvasColumn(2);
    const header = column.getElement().querySelector('.canvas-column__header');
    expect(header).not.toBeNull();
    expect(header!.textContent).toBe('Column 3');
  });

  it('returns the correct index', () => {
    const column = new CanvasColumn(5);
    expect(column.getIndex()).toBe(5);
  });
});
