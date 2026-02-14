import { describe, it, expect } from 'vitest';
import { DragGhost } from '../DragGhost';

describe('DragGhost', () => {
  it('starts hidden', () => {
    const ghost = new DragGhost();
    expect(ghost.getElement().style.display).toBe('none');
  });

  it('becomes visible when show() is called', () => {
    const ghost = new DragGhost();
    ghost.show('Filter', '#4A90D9');
    expect(ghost.getElement().style.display).toBe('block');
  });

  it('displays the block name when shown', () => {
    const ghost = new DragGhost();
    ghost.show('Filter', '#4A90D9');
    expect(ghost.getElement().textContent).toBe('Filter');
  });

  it('sets the background color when shown', () => {
    const ghost = new DragGhost();
    ghost.show('Filter', '#4A90D9');
    expect(ghost.getElement().style.backgroundColor).toBe('rgb(74, 144, 217)');
  });

  it('hides when hide() is called', () => {
    const ghost = new DragGhost();
    ghost.show('Filter', '#4A90D9');
    ghost.hide();
    expect(ghost.getElement().style.display).toBe('none');
  });

  it('updates name and color on subsequent show() calls', () => {
    const ghost = new DragGhost();
    ghost.show('Filter', '#4A90D9');
    ghost.show('Sort', '#FF5733');
    expect(ghost.getElement().textContent).toBe('Sort');
    expect(ghost.getElement().style.backgroundColor).toBe('rgb(255, 87, 51)');
  });

  it('has pointer-events: none so it does not intercept clicks', () => {
    const ghost = new DragGhost();
    expect(ghost.getElement().style.pointerEvents).toBe('none');
  });
});
