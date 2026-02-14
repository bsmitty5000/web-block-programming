import { BlockInstance, Column, Workspace, WorkspaceConfig } from '../types/workspace';
import { Position, DropTarget } from '../types/drag';
import { BlockRegistry } from './BlockRegistry';

export class LayoutEngine {
    private registry: BlockRegistry;

    // Layout constants (derived from block structure)
    static readonly HEADER_HEIGHT_PX = 36;
    static readonly PARAM_ROW_HEIGHT_PX = 32;
    static readonly BLOCK_PADDING_PX = 8;
    static readonly COLUMN_GAP_PX = 16;
    static readonly COLUMN_HEADER_HEIGHT_PX = 35;

    /** Stores the registry reference for later use in parameter count lookups. */
    constructor(registry: BlockRegistry) 
    { 
    this.registry = registry;
    }

    /**
     * Convenience method: returns { x, y } for a block by combining
     * `calculateColumnX(block.columnIndex, ...)` and `calculateBlockY(block.orderIndex, ...)`.
     */
    calculateBlockPosition(block: BlockInstance, workspace: Workspace): Position 
    { 
        return {    x: this.calculateColumnX(block.columnIndex, workspace.config), 
                    y: this.calculateBlockY(block.orderIndex, workspace.columns[block.columnIndex], workspace.config) };

    }

    /**
     * Returns the x pixel offset for a column.
     * Formula: `config.canvasPaddingPx + columnIndex * (config.columnWidthPx + COLUMN_GAP_PX)`.
     */
    calculateColumnX(columnIndex: number, config: WorkspaceConfig): number 
    { 
        return config.canvasPaddingPx + columnIndex * (config.columnWidthPx + LayoutEngine.COLUMN_GAP_PX);
    }

    /**
     * Returns the y pixel offset for a block at `orderIndex` within `column`.
     * Iterates blocks 0..orderIndex-1 in the column, sums their heights + `config.blockGapPx`
     * between each, starting from `config.canvasPaddingPx` (or 0 if padding is on the container).
     * Needs the registry to look up each block's definition and count its parameters.
     */
    calculateBlockY(orderIndex: number, column: Column, config: WorkspaceConfig): number 
    { 
        let yPixelOffset = LayoutEngine.COLUMN_HEADER_HEIGHT_PX + config.canvasPaddingPx;

        for (let i = 0; i < orderIndex; i++) 
        {
            yPixelOffset += 
                this.getBlockHeight(column.blocks[i]) +
                config.blockGapPx;
        }

        return yPixelOffset;
    }

    /**
     * Returns the pixel height of a block.
     * Formula: `HEADER_HEIGHT_PX + (paramCount * PARAM_ROW_HEIGHT_PX) + BLOCK_PADDING_PX`.
     * Looks up `registry.get(block.definitionId).parameters.length` to get `paramCount`.
     */
    getBlockHeight(block: BlockInstance): number 
    { 
        const def = this.registry.get(block.definitionId);
        return  LayoutEngine.HEADER_HEIGHT_PX
                + def.parameters.length * LayoutEngine.PARAM_ROW_HEIGHT_PX
                + LayoutEngine.BLOCK_PADDING_PX;
    }

    /**
     * Hit-test: given mouse coordinates (relative to the canvas container), determines
     * which column the mouse is over (by comparing mouseX against column x ranges) and
     * which insertion slot the mouse is closest to (by comparing mouseY against block
     * y positions in that column). Returns `{ columnIndex, orderIndex, indicatorY }` or
     * `null` if the mouse is outside all columns.
     *
     * `indicatorY` is the y pixel position where a drop indicator line should be drawn.
     */
    getDropTarget(mouseX: number, mouseY: number, workspace: Workspace): DropTarget | null
    {
        const adjustedX = mouseX - workspace.config.canvasPaddingPx;
        console.log('[LayoutEngine.getDropTarget] mouseX:', mouseX, 'mouseY:', mouseY, 'adjustedX:', adjustedX);

        if (adjustedX < 0) return null;

        const columnWidth = workspace.config.columnWidthPx + LayoutEngine.COLUMN_GAP_PX;
        const columnIndex = Math.floor(adjustedX / columnWidth);
        const posInColumn = adjustedX % columnWidth;
        console.log('[LayoutEngine.getDropTarget] columnWidth:', columnWidth, 'columnIndex:', columnIndex, 'posInColumn:', posInColumn);
        
        // In the gap between columns, or past the last column
        if (posInColumn > workspace.config.columnWidthPx || columnIndex >= workspace.columns.length) {
            console.log('[LayoutEngine.getDropTarget] outside columns, returning null');
            return null;
        }

        const column = workspace.columns[columnIndex];
        console.log('[LayoutEngine.getDropTarget] hit column:', columnIndex, 'blocks in column:', column.blocks.length);
        // Find the insertion slot closest to mouseY
        for (let i = 0; i < column.blocks.length; i++)
        {
            const blockY = this.calculateBlockY(i, column, workspace.config);
            const blockHeight = this.getBlockHeight(column.blocks[i]);
            const blockMidY = blockY + blockHeight / 2;

            if (mouseY < blockMidY)
            {
                // Insert before this block
                return {
                    columnIndex,
                    orderIndex: i,
                    indicatorY: blockY - workspace.config.blockGapPx / 2
                };
            }
        }

        // Mouse is below all blocks — insert at end
        const lastIndex = column.blocks.length;
        const indicatorY = this.calculateBlockY(lastIndex, column, workspace.config);
        return {
            columnIndex,
            orderIndex: lastIndex,
            indicatorY
        };
    }
}