import { describe, it, expect, vi } from 'vitest';
import { BooleanToggle } from '../BooleanToggle';
import { ParameterType } from '../../../../types/blocks';

describe('BooleanToggle', () => {
  const paramDef = {
    id: 'enabled',
    name: 'Enabled',
    type: ParameterType.BOOLEAN,
    defaultValue: false,
  };

  it('starts unchecked when initial value is false', () => {
    const toggle = new BooleanToggle(paramDef, false, vi.fn());
    const inputEl = toggle.getElement().querySelector('input') as HTMLInputElement;
    expect(inputEl.checked).toBe(false);
  });

  it('starts checked when initial value is true', () => {
    const toggle = new BooleanToggle(paramDef, true, vi.fn());
    const inputEl = toggle.getElement().querySelector('input') as HTMLInputElement;
    expect(inputEl.checked).toBe(true);
  });

  it('calls onChange with true when clicked', () => {
    const onChange = vi.fn();
    const toggle = new BooleanToggle(paramDef, false, onChange);
    const inputEl = toggle.getElement().querySelector('input') as HTMLInputElement;

    inputEl.checked = true;
    inputEl.dispatchEvent(new Event('change'));

    expect(onChange).toHaveBeenCalledWith('enabled', true);
  });
});
