import { describe, it, expect } from 'vitest';
import { PaletteBlock } from '../PaletteBlock';
import { BlockDefinition } from '../../../types/blocks';

function makeBlock(overrides: Partial<BlockDefinition> & { id: string }): BlockDefinition {
  return {
    name: overrides.id,
    category: 'Default',
    description: 'A test block',
    color: '#000000',
    parameters: [],
    ...overrides,
  };
}

describe('PaletteBlock', () => {
  it('renders an element containing the block name', () => {
    const def = makeBlock({ id: 'filter', name: 'Filter' });
    const block = new PaletteBlock(def);
    const el = block.getElement();

    expect(el.textContent).toContain('Filter');
  });

  it('sets the background color from the definition', () => {
    const def = makeBlock({ id: 'filter', color: '#4A90D9' });
    const block = new PaletteBlock(def);
    const el = block.getElement();

    expect(el.style.backgroundColor).toBe('rgb(74, 144, 217)');
  });

  it('renders the block description', () => {
    const def = makeBlock({ id: 'filter', description: 'Filters items based on a condition' });
    const block = new PaletteBlock(def);
    const el = block.getElement();

    expect(el.textContent).toContain('Filters items based on a condition');
  });

  it('returns the correct definition ID', () => {
    const def = makeBlock({ id: 'sort' });
    const block = new PaletteBlock(def);

    expect(block.getDefinitionId()).toBe('sort');
  });

  it('has the palette-block class', () => {
    const def = makeBlock({ id: 'filter' });
    const block = new PaletteBlock(def);

    expect(block.getElement().className).toBe('palette-block');
  });
});
