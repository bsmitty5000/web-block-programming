import { describe, it, expect, beforeEach } from 'vitest';
import { init } from '../index';

describe('smoke test', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
  });

  it('initializes without throwing', () => {
    const container = document.getElementById('app')!;
    expect(() => init(container)).not.toThrow();
  });

  it('renders the app layout into the container', () => {
    const container = document.getElementById('app')!;
    init(container);
    expect(container.querySelector('.app__palette')).not.toBeNull();
    expect(container.querySelector('.app__canvas')).not.toBeNull();
  });
});
