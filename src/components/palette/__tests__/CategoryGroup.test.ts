import { describe, it, expect } from 'vitest';
import { CategoryGroup } from '../CategoryGroup';
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

describe('CategoryGroup', () => {
  const definitions: BlockDefinition[] = [
    makeBlock({ id: 'filter', name: 'Filter', category: 'Transform' }),
    makeBlock({ id: 'sort', name: 'Sort', category: 'Transform' }),
    makeBlock({ id: 'map', name: 'Map', category: 'Transform' }),
  ];

  it('renders the header text matching the category name', () => {
    const group = new CategoryGroup('Transform', definitions);
    const el = group.getElement();
    const header = el.querySelector('h2');

    expect(header).not.toBeNull();
    expect(header!.textContent).toBe('Transform');
  });

  it('renders the correct number of block elements', () => {
    const group = new CategoryGroup('Transform', definitions);
    const el = group.getElement();
    const listItems = el.querySelectorAll('li');

    expect(listItems.length).toBe(3);
  });

  it('collapses the block list when header is clicked', () => {
    const group = new CategoryGroup('Transform', definitions);
    const el = group.getElement();
    const header = el.querySelector('h2')!;
    const blockList = el.querySelector('.block-list') as HTMLElement;

    expect(blockList.style.display).not.toBe('none');

    header.click();
    expect(blockList.style.display).toBe('none');
  });

  it('expands the block list when header is clicked again', () => {
    const group = new CategoryGroup('Transform', definitions);
    const el = group.getElement();
    const header = el.querySelector('h2')!;
    const blockList = el.querySelector('.block-list') as HTMLElement;

    header.click();
    expect(blockList.style.display).toBe('none');

    header.click();
    expect(blockList.style.display).toBe('block');
  });

  it('has the category-group class', () => {
    const group = new CategoryGroup('Transform', definitions);
    expect(group.getElement().className).toBe('category-group');
  });
});
