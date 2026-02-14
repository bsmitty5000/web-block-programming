import { describe, it, expect, vi } from 'vitest';
import { ColorPicker } from '../ColorPicker';
import { ParameterType } from '../../../../types/blocks';

describe('ColorPicker', () => {
  const paramDef = {
    id: 'color',
    name: 'Color',
    type: ParameterType.COLOR,
    defaultValue: '#000000',
  };

  it('sets the initial color value', () => {
    const picker = new ColorPicker(paramDef, '#ff0000', vi.fn());
    const inputEl = picker.getElement().querySelector('input') as HTMLInputElement;
    expect(inputEl.value).toBe('#ff0000');
  });

  it('calls onChange when the color changes', () => {
    const onChange = vi.fn();
    const picker = new ColorPicker(paramDef, '#000000', onChange);
    const inputEl = picker.getElement().querySelector('input') as HTMLInputElement;

    inputEl.value = '#00ff00';
    inputEl.dispatchEvent(new Event('input'));

    expect(onChange).toHaveBeenCalledWith('color', '#00ff00');
  });
});
