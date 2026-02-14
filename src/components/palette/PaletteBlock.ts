import { BlockDefinition } from "../../types/blocks";

export class PaletteBlock
{
    private containerEl: HTMLElement;
    private definition: BlockDefinition;

    constructor(definition: BlockDefinition, onDragStart?: (definitionId: string, mouseX: number, mouseY: number) => void)
    {
        this.definition = definition;
        this.containerEl = document.createElement('div');
        this.containerEl.className = 'palette-block';
        this.containerEl.style.backgroundColor = definition.color;

        const header = document.createElement('h3');
        header.textContent = definition.name;

        const description = document.createElement('p');
        description.textContent = definition.description;

        this.containerEl.appendChild(header);
        this.containerEl.appendChild(description);

        if (onDragStart)
        {
            this.containerEl.addEventListener('mousedown', (e: MouseEvent) => {
                e.preventDefault();
                onDragStart(definition.id, e.clientX, e.clientY);
            });
        }
    }

    getDefinitionId(): string
    {
        return this.definition.id;
    }

    getElement(): HTMLElement
    {
        return this.containerEl;
    }
}
