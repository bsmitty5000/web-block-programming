import { describe, it, expect } from 'vitest';
import { BlockPalette } from '../BlockPalette';
import { BlockRegistry } from '../../../services/BlockRegistry';
import { BlockDefinition } from '../../../types/blocks';

function makeBlock(overrides: Partial<BlockDefinition> & { id: string }): BlockDefinition {
  return {
    name: overrides.id,
    category: 'Default',
    description: '',
    color: '#000000',
    parameters: [],
    ...overrides,
  };
}

function createRegistryWithBlocks(): BlockRegistry {
  const registry = new BlockRegistry();
  registry.register(makeBlock({ id: 'read-file', name: 'Read File', category: 'Input' }));
  registry.register(makeBlock({ id: 'http-request', name: 'HTTP Request', category: 'Input' }));
  registry.register(makeBlock({ id: 'filter', name: 'Filter', category: 'Transform' }));
  registry.register(makeBlock({ id: 'sort', name: 'Sort', category: 'Transform' }));
  registry.register(makeBlock({ id: 'map', name: 'Map', category: 'Transform' }));
  return registry;
}

describe('BlockPalette', () => {
  it('renders the correct number of category groups', () => {
    const container = document.createElement('div');
    const registry = createRegistryWithBlocks();
    new BlockPalette(container, registry);

    const groups = container.querySelectorAll('.category-group');
    expect(groups.length).toBe(2);
  });

  it('renders category groups with correct headers', () => {
    const container = document.createElement('div');
    const registry = createRegistryWithBlocks();
    new BlockPalette(container, registry);

    const headers = container.querySelectorAll('h2');
    const headerTexts = Array.from(headers).map(h => h.textContent);

    expect(headerTexts).toContain('Input');
    expect(headerTexts).toContain('Transform');
  });

  it('renders the correct number of blocks per category', () => {
    const container = document.createElement('div');
    const registry = createRegistryWithBlocks();
    new BlockPalette(container, registry);

    const groups = container.querySelectorAll('.category-group');
    // Categories are sorted alphabetically: Input, Transform
    const inputBlocks = groups[0].querySelectorAll('.palette-block');
    const transformBlocks = groups[1].querySelectorAll('.palette-block');

    expect(inputBlocks.length).toBe(2);
    expect(transformBlocks.length).toBe(3);
  });

  it('renders all block names', () => {
    const container = document.createElement('div');
    const registry = createRegistryWithBlocks();
    new BlockPalette(container, registry);

    const blockEls = container.querySelectorAll('.palette-block');
    const blockTexts = Array.from(blockEls).map(el => el.textContent);

    expect(blockTexts).toContain('Read File');
    expect(blockTexts).toContain('HTTP Request');
    expect(blockTexts).toContain('Filter');
    expect(blockTexts).toContain('Sort');
    expect(blockTexts).toContain('Map');
  });

  it('returns the container element', () => {
    const container = document.createElement('div');
    const registry = createRegistryWithBlocks();
    const palette = new BlockPalette(container, registry);

    expect(palette.getElement()).toBe(container);
  });
});
