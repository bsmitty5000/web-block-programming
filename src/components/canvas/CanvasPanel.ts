import { WorkspaceManager } from '../../services/WorkspaceManager';
import { CanvasColumn } from './CanvasColumn';

export class CanvasPanel {
    private containerEl: HTMLElement;
    private columnsContainerEl: HTMLElement;
    private columns: CanvasColumn[];
    private workspaceManager: WorkspaceManager;

    /**
     * 1. Stores `workspaceManager` reference.
     * 2. Creates `containerEl` — `<div class="canvas">` appended to `container`.
     * 3. Calls `render()`.
     */
    constructor(container: HTMLElement, workspaceManager: WorkspaceManager)
    {
        this.workspaceManager = workspaceManager;
        this.columns = [];

        this.containerEl = document.createElement('div');
        this.containerEl.className = 'canvas';
        container.appendChild(this.containerEl);

        this.columnsContainerEl = document.createElement('div');
        this.columnsContainerEl.className = 'canvas__columns';

        this.render();
    }

    /**
     * 1. Creates `columnsContainerEl` — `<div class="canvas__columns">` with flexbox row layout.
     * 2. Reads `workspaceManager.getWorkspace().config.columnCount`.
     * 3. For each column index, creates a `CanvasColumn` and appends its element to `columnsContainerEl`.
     * 4. Registers each column's DOM element with `workspaceManager.registerColumnElement(index, el)`.
     * 5. Stores the `CanvasColumn` instances in `columns`.
     * 6. Appends `columnsContainerEl` to `containerEl`.
     */
    private render(): void
    {
        const config = this.workspaceManager.getWorkspace().config;

        for (let i = 0; i < config.columnCount; i++)
        {
            const column = new CanvasColumn(i);
            this.columns.push(column);
            this.columnsContainerEl.appendChild(column.getElement());
            this.workspaceManager.registerColumnElement(i, column.getElement());
        }

        this.containerEl.appendChild(this.columnsContainerEl);
    }

    getElement(): HTMLElement
    {
        return this.containerEl;
    }
}
