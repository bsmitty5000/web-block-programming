import { ParameterDefinition } from '../../../types/blocks';

export class BooleanToggle {
    private containerEl: HTMLElement;
    private inputEl: HTMLInputElement;
    private labelEl: HTMLLabelElement;

    constructor(
        paramDef: ParameterDefinition,
        initialValue: boolean,
        onChange: (paramId: string, value: boolean) => void
    )
    {
        this.containerEl = document.createElement('div');
        this.containerEl.className = 'param-row';

        this.labelEl = document.createElement('label');
        this.labelEl.className = 'param-row__label';
        this.labelEl.textContent = paramDef.name;

        this.inputEl = document.createElement('input');
        this.inputEl.type = 'checkbox';
        this.inputEl.className = 'param-row__input';
        this.inputEl.checked = initialValue;

        this.inputEl.addEventListener('change', () => {
            onChange(paramDef.id, this.inputEl.checked);
        });

        this.containerEl.appendChild(this.labelEl);
        this.containerEl.appendChild(this.inputEl);
    }

    getValue(): boolean { return this.inputEl.checked; }
    setValue(value: boolean): void { this.inputEl.checked = value; }
    getElement(): HTMLElement { return this.containerEl; }
}
