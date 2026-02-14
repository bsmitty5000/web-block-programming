import { ParameterDefinition, ParameterType } from '../../../types/blocks';
import { TextInput } from './TextInput';
import { NumberInput } from './NumberInput';
import { BooleanToggle } from './BooleanToggle';
import { SelectDropdown } from './SelectDropdown';
import { ColorPicker } from './ColorPicker';

/** Factory that creates the correct input component based on parameter type. */
export class InlineParam {
    static create(
        paramDef: ParameterDefinition,
        initialValue: unknown,
        onChange: (paramId: string, value: unknown) => void
    ): HTMLElement
    {
        switch (paramDef.type)
        {
            case ParameterType.TEXT:
                return new TextInput(paramDef, initialValue as string, onChange).getElement();
            case ParameterType.NUMBER:
                return new NumberInput(paramDef, initialValue as number, onChange).getElement();
            case ParameterType.BOOLEAN:
                return new BooleanToggle(paramDef, initialValue as boolean, onChange).getElement();
            case ParameterType.SELECT:
                return new SelectDropdown(paramDef, initialValue as string, onChange).getElement();
            case ParameterType.COLOR:
                return new ColorPicker(paramDef, initialValue as string, onChange).getElement();
            default:
                throw new Error(`Unknown parameter type: ${paramDef.type}`);
        }
    }
}
