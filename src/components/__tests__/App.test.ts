import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { App } from '../App';

describe('App component', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('mounts and creates the root element with correct class', () => {
    const app = new App(container);
    const root = app.getRootElement();

    expect(root).toBe(container);
    expect(root.classList.contains('app')).toBe(true);
  });

  it('creates and appends palette container', () => {
    const app = new App(container);
    const paletteContainer = app.getPaletteContainer();

    expect(paletteContainer).toBeInstanceOf(HTMLElement);
    expect(paletteContainer.classList.contains('app__palette')).toBe(true);
    expect(container.contains(paletteContainer)).toBe(true);
  });

  it('creates and appends canvas container', () => {
    const app = new App(container);
    const canvasContainer = app.getCanvasContainer();

    expect(canvasContainer).toBeInstanceOf(HTMLElement);
    expect(canvasContainer.classList.contains('app__canvas')).toBe(true);
    expect(container.contains(canvasContainer)).toBe(true);
  });

  it('appends both containers to the root element in order', () => {
    const app = new App(container);
    const paletteContainer = app.getPaletteContainer();
    const canvasContainer = app.getCanvasContainer();

    const children = container.children;
    expect(children.length).toBe(2);
    expect(children[0]).toBe(paletteContainer);
    expect(children[1]).toBe(canvasContainer);
  });

  it('returns the same container references on subsequent calls', () => {
    const app = new App(container);
    const palette1 = app.getPaletteContainer();
    const canvas1 = app.getCanvasContainer();
    const palette2 = app.getPaletteContainer();
    const canvas2 = app.getCanvasContainer();

    expect(palette1).toBe(palette2);
    expect(canvas1).toBe(canvas2);
  });
});
