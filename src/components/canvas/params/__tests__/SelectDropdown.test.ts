import { describe, it, expect, vi } from 'vitest';
import { SelectDropdown } from '../SelectDropdown';
import { ParameterType } from '../../../../types/blocks';

describe('SelectDropdown', () => {
  const paramDef = {
    id: 'operator',
    name: 'Operator',
    type: ParameterType.SELECT,
    defaultValue: 'equals',
    options: [
      { label: 'Equals', value: 'equals' },
      { label: 'Contains', value: 'contains' },
      { label: 'Starts With', value: 'starts_with' },
    ],
  };

  it('renders 3 options', () => {
    const dropdown = new SelectDropdown(paramDef, 'equals', vi.fn());
    const selectEl = dropdown.getElement().querySelector('select') as HTMLSelectElement;
    expect(selectEl.options).toHaveLength(3);
  });

  it('sets the initial value', () => {
    const dropdown = new SelectDropdown(paramDef, 'contains', vi.fn());
    const selectEl = dropdown.getElement().querySelector('select') as HTMLSelectElement;
    expect(selectEl.value).toBe('contains');
  });

  it('calls onChange when selection changes', () => {
    const onChange = vi.fn();
    const dropdown = new SelectDropdown(paramDef, 'equals', onChange);
    const selectEl = dropdown.getElement().querySelector('select') as HTMLSelectElement;

    selectEl.value = 'starts_with';
    selectEl.dispatchEvent(new Event('change'));

    expect(onChange).toHaveBeenCalledWith('operator', 'starts_with');
  });
});
