import { BlockInstance } from '../../types/workspace';
import { BlockDefinition } from '../../types/blocks';
import { BlockHeader } from './BlockHeader';
import { InlineParam } from './params/InlineParam';

export class CanvasBlock {
    private containerEl: HTMLElement;
    private headerEl: HTMLElement;
    private paramsContainerEl: HTMLElement;
    private instance: BlockInstance;
    private definition: BlockDefinition;
    private onParamChange: ((paramId: string, value: unknown) => void) | null;

    constructor(
        instance: BlockInstance,
        definition: BlockDefinition,
        onDelete?: () => void,
        onCopy?: () => void,
        onParamChange?: (paramId: string, value: unknown) => void,
        onDragStart?: (instanceId: string, mouseX: number, mouseY: number) => void
    )
    {
        this.instance = instance;
        this.definition = definition;
        this.onParamChange = onParamChange ?? null;

        this.containerEl = document.createElement('div');
        this.containerEl.className = 'canvas-block';
        this.containerEl.style.position = 'absolute';
        this.containerEl.dataset.instanceId = instance.id;

        this.headerEl = document.createElement('div');
        this.paramsContainerEl = document.createElement('div');
        this.paramsContainerEl.className = 'canvas-block__params';

        this.render(onDelete, onCopy, onDragStart);
    }

    private render(onDelete?: () => void, onCopy?: () => void,
                   onDragStart?: (instanceId: string, mouseX: number, mouseY: number) => void): void
    {
        const header = new BlockHeader(this.definition, onDelete, onCopy);
        this.headerEl = header.getElement();

        if (onDragStart)
        {
            this.headerEl.addEventListener('mousedown', (e: MouseEvent) => {
                e.preventDefault();
                onDragStart(this.instance.id, e.clientX, e.clientY);
            });
        }

        this.containerEl.appendChild(this.headerEl);

        // Render inline parameter inputs
        for (const paramDef of this.definition.parameters)
        {
            const initialValue = this.instance.parameterValues[paramDef.id] ?? paramDef.defaultValue;
            const paramEl = InlineParam.create(paramDef, initialValue, (paramId, value) => {
                if (this.onParamChange)
                {
                    this.onParamChange(paramId, value);
                }
            });
            this.paramsContainerEl.appendChild(paramEl);
        }

        this.containerEl.appendChild(this.paramsContainerEl);
    }

    getElement(): HTMLElement
    {
        return this.containerEl;
    }

    getInstanceId(): string
    {
        return this.instance.id;
    }
}
