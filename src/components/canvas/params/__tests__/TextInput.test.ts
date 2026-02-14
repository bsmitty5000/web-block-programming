import { describe, it, expect, vi } from 'vitest';
import { TextInput } from '../TextInput';
import { ParameterType } from '../../../../types/blocks';

describe('TextInput', () => {
  const paramDef = {
    id: 'field',
    name: 'Field',
    type: ParameterType.TEXT,
    defaultValue: '',
  };

  it('displays the initial value', () => {
    const input = new TextInput(paramDef, 'hello', vi.fn());
    const inputEl = input.getElement().querySelector('input') as HTMLInputElement;
    expect(inputEl.value).toBe('hello');
  });

  it('displays the parameter name as a label', () => {
    const input = new TextInput(paramDef, '', vi.fn());
    const label = input.getElement().querySelector('label');
    expect(label!.textContent).toBe('Field');
  });

  it('calls onChange when the input value changes', () => {
    const onChange = vi.fn();
    const input = new TextInput(paramDef, '', onChange);
    const inputEl = input.getElement().querySelector('input') as HTMLInputElement;

    inputEl.value = 'world';
    inputEl.dispatchEvent(new Event('input'));

    expect(onChange).toHaveBeenCalledWith('field', 'world');
  });

  it('getValue returns the current value', () => {
    const input = new TextInput(paramDef, 'test', vi.fn());
    expect(input.getValue()).toBe('test');
  });

  it('setValue updates the input', () => {
    const input = new TextInput(paramDef, '', vi.fn());
    input.setValue('updated');
    expect(input.getValue()).toBe('updated');
  });
});
