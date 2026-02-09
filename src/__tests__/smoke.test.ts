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

  it('renders a heading into the container', () => {
    const container = document.getElementById('app')!;
    init(container);
    const heading = container.querySelector('h1');
    expect(heading).not.toBeNull();
    expect(heading!.textContent).toBe('Block Programming App');
  });
});
