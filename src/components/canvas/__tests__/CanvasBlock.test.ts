import { describe, it, expect, vi } from 'vitest';
import { CanvasBlock } from '../CanvasBlock';
import { BlockDefinition, ParameterType } from '../../../types/blocks';
import { BlockInstance } from '../../../types/workspace';

function makeDefinition(overrides?: Partial<BlockDefinition>): BlockDefinition {
  return {
    id: 'filter',
    name: 'Filter',
    category: 'Transform',
    description: 'Filter rows',
    color: '#4A90D9',
    parameters: [],
    ...overrides,
  };
}

function makeInstance(overrides?: Partial<BlockInstance>): BlockInstance {
  return {
    id: 'block-1',
    definitionId: 'filter',
    columnIndex: 0,
    orderIndex: 0,
    parameterValues: {},
    ...overrides,
  };
}

describe('CanvasBlock', () => {
  it('creates an element with the canvas-block class', () => {
    const block = new CanvasBlock(makeInstance(), makeDefinition());
    expect(block.getElement().className).toBe('canvas-block');
  });

  it('sets position: absolute on the container', () => {
    const block = new CanvasBlock(makeInstance(), makeDefinition());
    expect(block.getElement().style.position).toBe('absolute');
  });

  it('stores the instance ID as a data attribute', () => {
    const block = new CanvasBlock(makeInstance({ id: 'block-42' }), makeDefinition());
    expect(block.getElement().dataset.instanceId).toBe('block-42');
  });

  it('returns the correct instance ID', () => {
    const block = new CanvasBlock(makeInstance({ id: 'block-7' }), makeDefinition());
    expect(block.getInstanceId()).toBe('block-7');
  });

  it('contains the block name in the header', () => {
    const block = new CanvasBlock(makeInstance(), makeDefinition({ name: 'Sort' }));
    const nameEl = block.getElement().querySelector('.block-header__name');
    expect(nameEl).not.toBeNull();
    expect(nameEl!.textContent).toBe('Sort');
  });

  it('applies the definition color to the header', () => {
    const block = new CanvasBlock(makeInstance(), makeDefinition({ color: '#FF5733' }));
    const header = block.getElement().querySelector('.block-header') as HTMLElement;
    expect(header.style.backgroundColor).toBe('rgb(255, 87, 51)');
  });

  it('renders parameter inputs for each parameter in the definition', () => {
    const def = makeDefinition({
      parameters: [
        { id: 'field', name: 'Field', type: ParameterType.TEXT, defaultValue: '' },
        { id: 'operator', name: 'Operator', type: ParameterType.SELECT, defaultValue: 'eq',
          options: [{ label: 'Equals', value: 'eq' }] },
        { id: 'value', name: 'Value', type: ParameterType.TEXT, defaultValue: '' },
      ],
    });
    const inst = makeInstance({ parameterValues: { field: '', operator: 'eq', value: '' } });
    const block = new CanvasBlock(inst, def);

    const paramRows = block.getElement().querySelectorAll('.param-row');
    expect(paramRows).toHaveLength(3);
  });

  it('renders no param rows for a block with no parameters', () => {
    const block = new CanvasBlock(makeInstance(), makeDefinition());
    const paramRows = block.getElement().querySelectorAll('.param-row');
    expect(paramRows).toHaveLength(0);
  });

  it('calls onParamChange when a parameter input changes', () => {
    const onParamChange = vi.fn();
    const def = makeDefinition({
      parameters: [
        { id: 'field', name: 'Field', type: ParameterType.TEXT, defaultValue: '' },
      ],
    });
    const inst = makeInstance({ parameterValues: { field: '' } });
    const block = new CanvasBlock(inst, def, undefined, undefined, onParamChange);

    const inputEl = block.getElement().querySelector('input[type="text"]') as HTMLInputElement;
    inputEl.value = 'name';
    inputEl.dispatchEvent(new Event('input'));

    expect(onParamChange).toHaveBeenCalledWith('field', 'name');
  });

  it('renders delete and copy buttons when callbacks are provided', () => {
    const onDelete = vi.fn();
    const onCopy = vi.fn();
    const block = new CanvasBlock(makeInstance(), makeDefinition(), onDelete, onCopy);

    expect(block.getElement().querySelector('.block-header__btn--delete')).not.toBeNull();
    expect(block.getElement().querySelector('.block-header__btn--copy')).not.toBeNull();
  });
});
