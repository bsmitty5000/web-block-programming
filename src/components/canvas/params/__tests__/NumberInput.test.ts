import { describe, it, expect, vi } from 'vitest';
import { NumberInput } from '../NumberInput';
import { ParameterType } from '../../../../types/blocks';

describe('NumberInput', () => {
  const paramDef = {
    id: 'count',
    name: 'Count',
    type: ParameterType.NUMBER,
    defaultValue: 0,
  };

  it('displays the initial value', () => {
    const input = new NumberInput(paramDef, 42, vi.fn());
    const inputEl = input.getElement().querySelector('input') as HTMLInputElement;
    expect(inputEl.value).toBe('42');
  });

  it('calls onChange with a number (not string) on change', () => {
    const onChange = vi.fn();
    const input = new NumberInput(paramDef, 0, onChange);
    const inputEl = input.getElement().querySelector('input') as HTMLInputElement;

    inputEl.value = '99';
    inputEl.dispatchEvent(new Event('change'));

    expect(onChange).toHaveBeenCalledWith('count', 99);
  });

  it('applies min/max/step from validation', () => {
    const paramWithValidation = {
      ...paramDef,
      validation: { required: false, min: 0, max: 100, step: 5 },
    };
    const input = new NumberInput(paramWithValidation, 50, vi.fn());
    const inputEl = input.getElement().querySelector('input') as HTMLInputElement;

    expect(inputEl.min).toBe('0');
    expect(inputEl.max).toBe('100');
    expect(inputEl.step).toBe('5');
  });
});
