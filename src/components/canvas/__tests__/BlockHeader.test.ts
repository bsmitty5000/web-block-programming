import { describe, it, expect, vi } from 'vitest';
import { BlockHeader } from '../BlockHeader';
import { BlockDefinition } from '../../../types/blocks';

function makeBlock(overrides?: Partial<BlockDefinition>): BlockDefinition {
  return {
    id: 'test-block',
    name: 'Test Block',
    category: 'Default',
    description: 'A test block',
    color: '#4A90D9',
    parameters: [],
    ...overrides,
  };
}

describe('BlockHeader', () => {
  it('creates an element with the block-header class', () => {
    const header = new BlockHeader(makeBlock());
    expect(header.getElement().className).toBe('block-header');
  });

  it('sets background color from the definition', () => {
    const header = new BlockHeader(makeBlock({ color: '#FF5733' }));
    expect(header.getElement().style.backgroundColor).toBe('rgb(255, 87, 51)');
  });

  it('displays the block name', () => {
    const header = new BlockHeader(makeBlock({ name: 'Filter' }));
    const nameEl = header.getElement().querySelector('.block-header__name');
    expect(nameEl).not.toBeNull();
    expect(nameEl!.textContent).toBe('Filter');
  });

  it('renders a copy button when onCopy is provided', () => {
    const onCopy = vi.fn();
    const header = new BlockHeader(makeBlock(), undefined, onCopy);
    const copyBtn = header.getElement().querySelector('.block-header__btn--copy');
    expect(copyBtn).not.toBeNull();
  });

  it('renders a delete button when onDelete is provided', () => {
    const onDelete = vi.fn();
    const header = new BlockHeader(makeBlock(), onDelete);
    const deleteBtn = header.getElement().querySelector('.block-header__btn--delete');
    expect(deleteBtn).not.toBeNull();
  });

  it('does not render buttons when callbacks are not provided', () => {
    const header = new BlockHeader(makeBlock());
    const buttons = header.getElement().querySelectorAll('.block-header__btn');
    expect(buttons).toHaveLength(0);
  });

  it('calls onCopy when the copy button is clicked', () => {
    const onCopy = vi.fn();
    const header = new BlockHeader(makeBlock(), undefined, onCopy);
    const copyBtn = header.getElement().querySelector('.block-header__btn--copy') as HTMLButtonElement;
    copyBtn.click();
    expect(onCopy).toHaveBeenCalledTimes(1);
  });

  it('calls onDelete when the delete button is clicked', () => {
    const onDelete = vi.fn();
    const header = new BlockHeader(makeBlock(), onDelete);
    const deleteBtn = header.getElement().querySelector('.block-header__btn--delete') as HTMLButtonElement;
    deleteBtn.click();
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
