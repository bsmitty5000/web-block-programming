import { ParameterDefinition } from '../../../types/blocks';

export class NumberInput {
    private containerEl: HTMLElement;
    private inputEl: HTMLInputElement;
    private labelEl: HTMLLabelElement;

    constructor(
        paramDef: ParameterDefinition,
        initialValue: number,
        onChange: (paramId: string, value: number) => void
    )
    {
        this.containerEl = document.createElement('div');
        this.containerEl.className = 'param-row';

        this.labelEl = document.createElement('label');
        this.labelEl.className = 'param-row__label';
        this.labelEl.textContent = paramDef.name;

        this.inputEl = document.createElement('input');
        this.inputEl.type = 'number';
        this.inputEl.className = 'param-row__input';
        this.inputEl.value = String(initialValue);

        if (paramDef.validation?.min !== undefined)
        {
            this.inputEl.min = String(paramDef.validation.min);
        }
        if (paramDef.validation?.max !== undefined)
        {
            this.inputEl.max = String(paramDef.validation.max);
        }
        if (paramDef.validation?.step !== undefined)
        {
            this.inputEl.step = String(paramDef.validation.step);
        }

        this.inputEl.addEventListener('change', () => {
            onChange(paramDef.id, Number(this.inputEl.value));
        });

        this.containerEl.appendChild(this.labelEl);
        this.containerEl.appendChild(this.inputEl);
    }

    getValue(): number { return Number(this.inputEl.value); }
    setValue(value: number): void { this.inputEl.value = String(value); }
    getElement(): HTMLElement { return this.containerEl; }
}
