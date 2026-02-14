import { DragState, DropTarget } from '../types/drag';
import { LayoutEngine } from './LayoutEngine';
import { WorkspaceManager } from './WorkspaceManager';
import { BlockRegistry } from './BlockRegistry';

export class DragManager
{
    private currentDrag: DragState | null;
    private layoutEngine: LayoutEngine;
    private workspaceManager: WorkspaceManager;
    private registry: BlockRegistry;
    private ghostEl: HTMLElement | null;
    private dropIndicatorEl: HTMLElement | null;
    private canvasEl: HTMLElement | null;
    private blockElements: Map<string, HTMLElement>;

    constructor(layoutEngine: LayoutEngine, workspaceManager: WorkspaceManager, registry: BlockRegistry)
    {
        this.layoutEngine = layoutEngine;
        this.workspaceManager = workspaceManager;
        this.registry = registry;
        this.currentDrag = null;
        this.ghostEl = null;
        this.dropIndicatorEl = null;
        this.canvasEl = null;
        this.blockElements = new Map();
    }

    startPaletteDrag(definitionId: string, mouseX: number, mouseY: number): void
    {
        const definition = this.registry.get(definitionId);

        this.currentDrag = {
            source: 'palette',
            definitionId,
            instanceId: null,
            originColumn: null,
            originOrder: null,
            mouseX,
            mouseY,
            currentDropTarget: null,
        };

        if (this.ghostEl)
        {
            this.ghostEl.textContent = definition.name;
            this.ghostEl.style.backgroundColor = definition.color;
            this.ghostEl.style.display = 'block';
        }

        this.updateGhostPosition(mouseX, mouseY);
    }

    startCanvasDrag(instanceId: string, mouseX: number, mouseY: number): void
    {
        const block = this.workspaceManager.getBlock(instanceId);
        const definition = this.registry.get(block.definitionId);

        this.currentDrag = {
            source: 'canvas',
            definitionId: block.definitionId,
            instanceId,
            originColumn: block.columnIndex,
            originOrder: block.orderIndex,
            mouseX,
            mouseY,
            currentDropTarget: null,
        };

        // Hide the original block element
        const blockEl = this.blockElements.get(instanceId);
        if (blockEl)
        {
            blockEl.style.opacity = '0';
        }

        // Show the ghost at the cursor
        if (this.ghostEl)
        {
            this.ghostEl.textContent = definition.name;
            this.ghostEl.style.backgroundColor = definition.color;
            this.ghostEl.style.display = 'block';
        }

        this.updateGhostPosition(mouseX, mouseY);
    }

    updateDrag(mouseX: number, mouseY: number): void
    {
        if (!this.currentDrag) return;

        this.currentDrag.mouseX = mouseX;
        this.currentDrag.mouseY = mouseY;

        this.updateGhostPosition(mouseX, mouseY);

        const workspace = this.workspaceManager.getWorkspace();

        // Convert viewport coordinates to canvas-relative coordinates
        let canvasX = mouseX;
        let canvasY = mouseY;
        if (this.canvasEl)
        {
            const rect = this.canvasEl.getBoundingClientRect();
            canvasX = mouseX - rect.left;
            canvasY = mouseY - rect.top;
        }

        console.log('[DragManager.updateDrag] viewport:', mouseX, mouseY, 'canvas-relative:', canvasX, canvasY);
        const target = this.layoutEngine.getDropTarget(canvasX, canvasY, workspace);
        console.log('[DragManager.updateDrag] dropTarget:', target);
        this.currentDrag.currentDropTarget = target;

        this.updateDropIndicator(target);
    }

    endDrag(): void
    {
        if (!this.currentDrag) return;

        const target = this.currentDrag.currentDropTarget;
        console.log('[DragManager.endDrag] source:', this.currentDrag.source, 'definitionId:', this.currentDrag.definitionId, 'target:', target);

        if (!target)
        {
            console.log('[DragManager.endDrag] no target, cancelling');
            this.cancelDrag();
            return;
        }

        if (this.currentDrag.source === 'palette')
        {
            console.log('[DragManager.endDrag] calling addBlock:', this.currentDrag.definitionId, target.columnIndex, target.orderIndex);
            const newBlock = this.workspaceManager.addBlock(
                this.currentDrag.definitionId,
                target.columnIndex,
                target.orderIndex
            );
            console.log('[DragManager.endDrag] addBlock returned:', newBlock);
        }
        else if (this.currentDrag.source === 'canvas' && this.currentDrag.instanceId)
        {
            this.workspaceManager.moveBlock(
                this.currentDrag.instanceId,
                target.columnIndex,
                target.orderIndex
            );
        }

        this.cleanupDragVisuals();
        this.currentDrag = null;
    }

    cancelDrag(): void
    {
        if (!this.currentDrag) return;

        // Restore the original block's opacity if it was a canvas drag
        if (this.currentDrag.source === 'canvas' && this.currentDrag.instanceId)
        {
            const blockEl = this.blockElements.get(this.currentDrag.instanceId);
            if (blockEl)
            {
                blockEl.style.opacity = '1';
            }
        }

        this.cleanupDragVisuals();
        this.currentDrag = null;
    }

    isDragging(): boolean
    {
        return this.currentDrag !== null;
    }

    getDragState(): DragState | null
    {
        return this.currentDrag;
    }

    registerGhostElement(el: HTMLElement): void
    {
        this.ghostEl = el;
    }

    registerDropIndicatorElement(el: HTMLElement): void
    {
        this.dropIndicatorEl = el;
    }

    registerCanvasElement(el: HTMLElement): void
    {
        this.canvasEl = el;
    }

    registerBlockElement(instanceId: string, el: HTMLElement): void
    {
        this.blockElements.set(instanceId, el);
    }

    unregisterBlockElement(instanceId: string): void
    {
        this.blockElements.delete(instanceId);
    }

    private updateGhostPosition(mouseX: number, mouseY: number): void
    {
        if (!this.ghostEl) return;

        this.ghostEl.style.left = `${mouseX + 10}px`;
        this.ghostEl.style.top = `${mouseY + 10}px`;
    }

    private updateDropIndicator(target: DropTarget | null): void
    {
        if (!this.dropIndicatorEl) return;

        if (!target)
        {
            this.dropIndicatorEl.style.display = 'none';
            return;
        }

        const columnEl = this.workspaceManager.getColumnElement(target.columnIndex);
        if (columnEl)
        {
            columnEl.appendChild(this.dropIndicatorEl);
        }

        this.dropIndicatorEl.style.top = `${target.indicatorY}px`;
        this.dropIndicatorEl.style.display = 'block';
    }

    private cleanupDragVisuals(): void
    {
        if (this.ghostEl)
        {
            this.ghostEl.style.display = 'none';
        }

        if (this.dropIndicatorEl)
        {
            this.dropIndicatorEl.style.display = 'none';
        }
    }
}
