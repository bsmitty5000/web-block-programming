import { describe, it, expect, beforeEach } from 'vitest';
import { init } from '../index';
import { BlockRegistry } from '../services/BlockRegistry';
import { BlockDefinitionConfig } from '../types/blocks';
import blocksData from '../config/blocks.json';

const sampleBlocks = blocksData as BlockDefinitionConfig;

function makeRegistry(): BlockRegistry {
  const registry = new BlockRegistry();
  registry.loadFromConfig(sampleBlocks);
  return registry;
}

describe('smoke test', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
  });

  it('initializes without throwing', () => {
    const container = document.getElementById('app')!;
    expect(() => init(container, makeRegistry())).not.toThrow();
  });

  it('renders the app layout into the container', () => {
    const container = document.getElementById('app')!;
    init(container, makeRegistry());
    expect(container.querySelector('.app__palette')).not.toBeNull();
    expect(container.querySelector('.app__canvas')).not.toBeNull();
  });
});
