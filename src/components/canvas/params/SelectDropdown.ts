import { ParameterDefinition } from '../../../types/blocks';

export class SelectDropdown {
    private containerEl: HTMLElement;
    private selectEl: HTMLSelectElement;
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

        this.selectEl = document.createElement('select');
        this.selectEl.className = 'param-row__input';

        for (const opt of paramDef.options ?? [])
        {
            const optionEl = document.createElement('option');
            optionEl.value = opt.value;
            optionEl.textContent = opt.label;
            this.selectEl.appendChild(optionEl);
        }

        this.selectEl.value = initialValue;

        this.selectEl.addEventListener('change', () => {
            onChange(paramDef.id, this.selectEl.value);
        });

        this.containerEl.appendChild(this.labelEl);
        this.containerEl.appendChild(this.selectEl);
    }

    getValue(): string { return this.selectEl.value; }
    setValue(value: string): void { this.selectEl.value = value; }
    getElement(): HTMLElement { return this.containerEl; }
}
