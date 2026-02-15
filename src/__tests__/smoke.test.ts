import { describe, it, expect, beforeEach } from 'vitest';
import { init } from '../index';
import { BlockRegistry } from '../services/BlockRegistry';
import { EventBus } from '../services/EventBus';
import { BlockDefinitionConfig } from '../types/blocks';
import blocksData from '../config/blocks.json';

const sampleBlocks = blocksData as BlockDefinitionConfig;

function makeRegistry(events: EventBus): BlockRegistry {
  const registry = new BlockRegistry(events);
  registry.loadFromConfig(sampleBlocks);
  return registry;
}

describe('smoke test', () => {
  let events: EventBus;

  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
    events = new EventBus();
  });

  it('initializes without throwing', () => {
    const container = document.getElementById('app')!;
    expect(() => init(container, makeRegistry(events), events, null)).not.toThrow();
  });

  it('renders the app layout into the container', () => {
    const container = document.getElementById('app')!;
    init(container, makeRegistry(events), events, null);
    expect(container.querySelector('.app__palette')).not.toBeNull();
    expect(container.querySelector('.app__canvas')).not.toBeNull();
  });
});
