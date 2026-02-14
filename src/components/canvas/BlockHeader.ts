import { BlockDefinition } from '../../types/blocks';

export class BlockHeader {
    private containerEl: HTMLElement;

    constructor(definition: BlockDefinition,
                onDelete?: () => void,
                onCopy?: () => void
    )
    {
        this.containerEl = document.createElement('div');
        this.containerEl.className = 'block-header';
        this.containerEl.style.backgroundColor = definition.color;

        const nameEl = document.createElement('span');
        nameEl.className = 'block-header__name';
        nameEl.textContent = definition.name;

        const actionsEl = document.createElement('div');
        actionsEl.className = 'block-header__actions';

        if (onCopy)
        {
            const copyBtn = document.createElement('button');
            copyBtn.className = 'block-header__btn block-header__btn--copy';
            copyBtn.textContent = 'Copy';
            copyBtn.addEventListener('click', onCopy);
            actionsEl.appendChild(copyBtn);
        }

        if (onDelete)
        {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'block-header__btn block-header__btn--delete';
            deleteBtn.textContent = 'Delete';
            deleteBtn.addEventListener('click', onDelete);
            actionsEl.appendChild(deleteBtn);
        }

        this.containerEl.appendChild(nameEl);
        this.containerEl.appendChild(actionsEl);
    }

    getElement(): HTMLElement
    {
        return this.containerEl;
    }
}
