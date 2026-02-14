import { BlockInstance, Column, Workspace, WorkspaceConfig } from '../types/workspace';
import { BlockRegistry } from './BlockRegistry';
import { LayoutEngine } from './LayoutEngine';
import { EventBus } from './EventBus';
import { CanvasBlock } from '../components/canvas/CanvasBlock';

export class WorkspaceManager {
    private workspace: Workspace;
    private blockElements: Map<string, HTMLElement>;
    private columnElements: Map<number, HTMLElement>;
    private registry: BlockRegistry;
    private layoutEngine: LayoutEngine;
    private events: EventBus;
    private nextInstanceId: number;
    private onBlockDragStart: ((instanceId: string, mouseX: number, mouseY: number) => void) | null;

    constructor(config: WorkspaceConfig,
                registry: BlockRegistry,
                layoutEngine: LayoutEngine,
                events: EventBus) 
    { 
        this.registry = registry;
        this.layoutEngine = layoutEngine;
        this.events = events;
        this.nextInstanceId = 1;
        this.blockElements = new Map();
        this.columnElements = new Map();
        this.onBlockDragStart = null;

        // Initialize workspace object first
        this.workspace = {
            config,
            columns: []
        };

        // Then populate columns
        for (let i = 0; i < config.columnCount; i++) 
        {
            this.workspace.columns.push({
                index: i,
                blocks: []
            });
        }
    }

    /**
     * 1. Generates a unique instance ID via `generateId()`.
     * 2. Looks up the `BlockDefinition` from the registry using `definitionId`.
     * 3. Creates a `BlockInstance` with the generated ID, definitionId, columnIndex, orderIndex,
     *    and `parameterValues` pre-filled with each parameter's `defaultValue`.
     * 4. Splices the instance into `workspace.columns[columnIndex].blocks` at `orderIndex`.
     * 5. Updates `orderIndex` values for all subsequent blocks in the column.
     * 6. Creates a `CanvasBlock` component (or the DOM element for the block) and registers it
     *    via `registerBlockElement()`. Appends the element to the column's DOM element.
     * 7. Calls `reflowColumn(columnIndex)` to reposition all blocks in the column.
     * 8. Emits `'workspace:changed'` on the event bus.
     * 9. Returns the created `BlockInstance`.
     */
    addBlock(definitionId: string, columnIndex: number, orderIndex: number): BlockInstance
    {
        const id = this.generateId();
        const definition = this.registry.get(definitionId);

        // Build parameterValues from definition defaults
        const parameterValues: Record<string, unknown> = {};
        for (const param of definition.parameters)
        {
            parameterValues[param.id] = param.defaultValue;
        }

        const instance: BlockInstance = {
            id,
            definitionId,
            columnIndex,
            orderIndex,
            parameterValues,
        };

        // Insert into the column at the requested position
        const column = this.workspace.columns[columnIndex];
        column.blocks.splice(orderIndex, 0, instance);

        // Update orderIndex for all blocks after the insertion point
        for (let i = orderIndex + 1; i < column.blocks.length; i++)
        {
            column.blocks[i].orderIndex = i;
        }

        // Create CanvasBlock DOM element
        const canvasBlock = new CanvasBlock(
            instance,
            definition,
            () => this.removeBlock(id),
            () => this.copyBlock(id),
            (paramId, value) => this.updateParameter(id, paramId, value),
            this.onBlockDragStart ?? undefined
        );
        const blockEl = canvasBlock.getElement();
        this.registerBlockElement(id, blockEl);

        const columnEl = this.columnElements.get(columnIndex);
        if (columnEl)
        {
            columnEl.appendChild(blockEl);
        }
        console.log('[WorkspaceManager.addBlock] created instance:', instance.id, 'DOM appended to column:', columnIndex);

        this.reflowColumn(columnIndex);
        this.events.emit('workspace:changed');

        return instance;
    }

    /**
     * 1. Finds the block instance by `instanceId` (search all columns).
     * 2. Removes the block from its column's `blocks` array.
     * 3. Updates `orderIndex` values for remaining blocks in that column.
     * 4. Removes the block's DOM element from the DOM and from `blockElements`.
     * 5. Calls `reflowColumn()` for the affected column.
     * 6. Emits `'workspace:changed'`.
     */
    removeBlock(instanceId: string): void
    {
        // Find which column contains this block
        for (const column of this.workspace.columns)
        {
            const blockIndex = column.blocks.findIndex(b => b.id === instanceId);
            if (blockIndex === -1) continue;

            // Remove from the array
            column.blocks.splice(blockIndex, 1);

            // Re-index remaining blocks
            for (let i = blockIndex; i < column.blocks.length; i++)
            {
                column.blocks[i].orderIndex = i;
            }

            // Remove the DOM element if it exists
            const el = this.blockElements.get(instanceId);
            if (el)
            {
                el.remove();
                this.blockElements.delete(instanceId);
            }

            this.reflowColumn(column.index);
            this.events.emit('workspace:changed');
            return;
        }

        throw new Error(`Block with ID "${instanceId}" not found.`);
    }

    /**
     * 1. Finds the block by `instanceId`, records its current column/order.
     * 2. Removes it from the source column's `blocks` array.
     * 3. Updates the block's `columnIndex` and `orderIndex` to the new values.
     * 4. Splices it into the target column's `blocks` array at `toOrder`.
     * 5. Updates `orderIndex` values for both source and target columns.
     * 6. Moves the DOM element from the source column element to the target column element.
     * 7. Calls `reflowColumn()` for both affected columns.
     * 8. Emits `'workspace:changed'`.
     */
    moveBlock(instanceId: string, toColumn: number, toOrder: number): void
    {
        // Find the block and its current location
        let block: BlockInstance | null = null;
        let fromColumn: Column | null = null;
        let fromIndex = -1;

        for (const column of this.workspace.columns)
        {
            const idx = column.blocks.findIndex(b => b.id === instanceId);
            if (idx !== -1)
            {
                block = column.blocks[idx];
                fromColumn = column;
                fromIndex = idx;
                break;
            }
        }

        if (!block || !fromColumn)
        {
            throw new Error(`Block with ID "${instanceId}" not found.`);
        }

        const targetColumn = this.workspace.columns[toColumn];

        // Remove from source column
        fromColumn.blocks.splice(fromIndex, 1);

        // If moving within the same column and the target index is after the
        // original position, adjust down by 1 since we just removed an element
        let adjustedOrder = toOrder;
        if (fromColumn.index === toColumn && toOrder > fromIndex)
        {
            adjustedOrder--;
        }

        // Update the block's position metadata
        block.columnIndex = toColumn;
        block.orderIndex = adjustedOrder;

        // Insert into target column
        targetColumn.blocks.splice(adjustedOrder, 0, block);

        // Re-index source column
        for (let i = 0; i < fromColumn.blocks.length; i++)
        {
            fromColumn.blocks[i].orderIndex = i;
        }

        // Re-index target column (skip if same column — already handled above)
        if (fromColumn.index !== toColumn)
        {
            for (let i = 0; i < targetColumn.blocks.length; i++)
            {
                targetColumn.blocks[i].orderIndex = i;
            }
        }

        // Move DOM element to target column if elements are registered
        const blockEl = this.blockElements.get(instanceId);
        const targetColEl = this.columnElements.get(toColumn);
        if (blockEl && targetColEl)
        {
            targetColEl.appendChild(blockEl);
        }

        this.reflowColumn(fromColumn.index);
        if (fromColumn.index !== toColumn)
        {
            this.reflowColumn(toColumn);
        }
        this.events.emit('workspace:changed');
    }

    /**
     * 1. Finds the source block by `instanceId`.
     * 2. Deep-copies `parameterValues`.
     * 3. Calls `addBlock()` with the same `definitionId`, same `columnIndex`,
     *    and `orderIndex = source.orderIndex + 1` (directly below the original).
     * 4. Overwrites the new block's `parameterValues` with the copied values.
     * 5. Returns the new `BlockInstance`.
     */
    copyBlock(instanceId: string): BlockInstance
    {
        const source = this.getBlock(instanceId);
        const copiedParams = JSON.parse(JSON.stringify(source.parameterValues));
        const copy = this.addBlock(source.definitionId, source.columnIndex, source.orderIndex + 1);
        copy.parameterValues = copiedParams;
        return copy;
    }

    /** Finds the block by ID and sets `parameterValues[paramId] = value`. Emits `'workspace:changed'`. */
    updateParameter(instanceId: string, paramId: string, value: unknown): void
    {
        const block = this.getBlock(instanceId);
        block.parameterValues[paramId] = value;
        this.events.emit('workspace:changed');
    }

    /** Get a column by index. */
    getColumn(index: number): Column
    {
        return this.workspace.columns[index];
    }

    /** Get a block instance by ID. Throws if not found. */
    getBlock(instanceId: string): BlockInstance
    {
        for (const column of this.workspace.columns)
        {
            const block = column.blocks.find(b => b.id === instanceId);
            if (block) return block;
        }
        throw new Error(`Block with ID "${instanceId}" not found.`);
    }

    /** Get the full workspace state. */
    getWorkspace(): Workspace
    {
        return this.workspace;
    }

    /** Stores a callback to invoke when a canvas block header is mousedown'd. */
    registerBlockDragHandler(handler: (instanceId: string, mouseX: number, mouseY: number) => void): void
    {
        this.onBlockDragStart = handler;
    }

    /** Stores a column's DOM element in `columnElements` map, keyed by column index. */
    registerColumnElement(index: number, el: HTMLElement): void
    {
        this.columnElements.set(index, el);
    }

    /** Stores a block's DOM element in `blockElements` map, keyed by instance ID. */
    registerBlockElement(instanceId: string, el: HTMLElement): void
    {
        this.blockElements.set(instanceId, el);
    }

    /** Get the DOM element for a block instance, or undefined if not registered. */
    getBlockElement(instanceId: string): HTMLElement | undefined
    {
        return this.blockElements.get(instanceId);
    }

    /** Get the DOM element for a column by index, or undefined if not registered. */
    getColumnElement(index: number): HTMLElement | undefined
    {
        return this.columnElements.get(index);
    }

    /** Subscribes to the `'workspace:changed'` event on the event bus. */
    onStateChange(callback: () => void): void
    {
        this.events.on('workspace:changed', callback);
    }

    /**
     * Iterates all blocks in the given column. For each block:
     * 1. Calls `layoutEngine.calculateBlockY()` to get its y position.
     * 2. Looks up the block's DOM element from `blockElements`.
     * 3. Sets the element's `top` style to position it correctly.
     */
    private reflowColumn(columnIndex: number): void
    {
        const column = this.workspace.columns[columnIndex];

        for (const block of column.blocks)
        {
            const y = this.layoutEngine.calculateBlockY(block.orderIndex, column, this.workspace.config);
            const el = this.blockElements.get(block.id);
            if (el)
            {
                el.style.top = `${y}px`;
            }
        }
    }

    /** Returns `'block-${nextInstanceId++}'`. */
    private generateId(): string
    {
        return `block-${this.nextInstanceId++}`;
    }
}