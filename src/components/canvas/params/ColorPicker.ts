import { ParameterDefinition } from '../../../types/blocks';

export class ColorPicker {
    private containerEl: HTMLElement;
    private inputEl: HTMLInputElement;
    private labelEl: HTMLLabelElement;

    constructor(
        paramDef: ParameterDefinition,
        initialValue: string,
        onChange: (paramId: string, value: string) => void
    )
    {
        this.containerEl = document.createElement('div');
        this.containerEl.className = 'param-row';

        this.labelEl = document.createElement('label');
        this.labelEl.className = 'param-row__label';
        this.labelEl.textContent = paramDef.name;

        this.inputEl = document.createElement('input');
        this.inputEl.type = 'color';
        this.inputEl.className = 'param-row__input';
        this.inputEl.value = initialValue;

        this.inputEl.addEventListener('input', () => {
            onChange(paramDef.id, this.inputEl.value);
        });

        this.containerEl.appendChild(this.labelEl);
        this.containerEl.appendChild(this.inputEl);
    }

    getValue(): string { return this.inputEl.value; }
    setValue(value: string): void { this.inputEl.value = value; }
    getElement(): HTMLElement { return this.containerEl; }
}
