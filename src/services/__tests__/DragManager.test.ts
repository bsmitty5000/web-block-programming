import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DragManager } from '../DragManager';
import { WorkspaceManager } from '../WorkspaceManager';
import { BlockRegistry } from '../BlockRegistry';
import { LayoutEngine } from '../LayoutEngine';
import { EventBus } from '../EventBus';
import { BlockDefinition, ParameterType } from '../../types/blocks';
import { WorkspaceConfig } from '../../types/workspace';

function makeBlock(overrides: Partial<BlockDefinition> & { id: string }): BlockDefinition {
  return {
    name: overrides.id,
    category: 'Default',
    description: '',
    color: '#000000',
    parameters: [],
    ...overrides,
  };
}

describe('DragManager', () => {
  let registry: BlockRegistry;
  let layoutEngine: LayoutEngine;
  let workspaceManager: WorkspaceManager;
  let dragManager: DragManager;
  let events: EventBus;
  let ghostEl: HTMLElement;
  let indicatorEl: HTMLElement;

  const filterDef = makeBlock({ id: 'filter', name: 'Filter', color: '#4A90D9' });
  const logDef = makeBlock({ id: 'log', name: 'Log', color: '#333333' });

  beforeEach(() => {
    registry = new BlockRegistry();
    registry.register(filterDef);
    registry.register(logDef);

    events = new EventBus();
    layoutEngine = new LayoutEngine(registry);

    const config: WorkspaceConfig = {
      columnCount: 3,
      columnWidthPx: 280,
      blockGapPx: 8,
      canvasPaddingPx: 20,
    };

    workspaceManager = new WorkspaceManager(config, registry, layoutEngine, events);

    // Register column elements so drop indicator can be appended
    for (let i = 0; i < 3; i++) {
      const colEl = document.createElement('div');
      workspaceManager.registerColumnElement(i, colEl);
    }

    dragManager = new DragManager(layoutEngine, workspaceManager, registry);

    ghostEl = document.createElement('div');
    ghostEl.style.display = 'none';
    indicatorEl = document.createElement('div');
    indicatorEl.style.display = 'none';
    dragManager.registerGhostElement(ghostEl);
    dragManager.registerDropIndicatorElement(indicatorEl);
  });

  describe('startPaletteDrag', () => {
    it('sets isDragging to true', () => {
      dragManager.startPaletteDrag('filter', 100, 200);
      expect(dragManager.isDragging()).toBe(true);
    });

    it('creates drag state with source palette', () => {
      dragManager.startPaletteDrag('filter', 100, 200);
      const state = dragManager.getDragState();
      expect(state).not.toBeNull();
      expect(state!.source).toBe('palette');
      expect(state!.definitionId).toBe('filter');
      expect(state!.instanceId).toBeNull();
      expect(state!.originColumn).toBeNull();
      expect(state!.originOrder).toBeNull();
    });

    it('shows the ghost element with block name and color', () => {
      dragManager.startPaletteDrag('filter', 100, 200);
      expect(ghostEl.style.display).toBe('block');
      expect(ghostEl.textContent).toBe('Filter');
      expect(ghostEl.style.backgroundColor).toBe('rgb(74, 144, 217)');
    });

    it('positions the ghost near the cursor', () => {
      dragManager.startPaletteDrag('filter', 100, 200);
      expect(ghostEl.style.left).toBe('110px');
      expect(ghostEl.style.top).toBe('210px');
    });
  });

  describe('startCanvasDrag', () => {
    it('creates drag state with source canvas and origin recorded', () => {
      const block = workspaceManager.addBlock('filter', 0, 0);
      const blockEl = document.createElement('div');
      dragManager.registerBlockElement(block.id, blockEl);

      dragManager.startCanvasDrag(block.id, 150, 250);

      const state = dragManager.getDragState();
      expect(state).not.toBeNull();
      expect(state!.source).toBe('canvas');
      expect(state!.instanceId).toBe(block.id);
      expect(state!.originColumn).toBe(0);
      expect(state!.originOrder).toBe(0);
    });

    it('hides the original block element', () => {
      const block = workspaceManager.addBlock('filter', 0, 0);
      const blockEl = document.createElement('div');
      dragManager.registerBlockElement(block.id, blockEl);

      dragManager.startCanvasDrag(block.id, 150, 250);
      expect(blockEl.style.opacity).toBe('0');
    });

    it('shows the ghost element', () => {
      const block = workspaceManager.addBlock('filter', 0, 0);
      const blockEl = document.createElement('div');
      dragManager.registerBlockElement(block.id, blockEl);

      dragManager.startCanvasDrag(block.id, 150, 250);
      expect(ghostEl.style.display).toBe('block');
    });
  });

  describe('updateDrag', () => {
    it('updates mouse position on the drag state', () => {
      dragManager.startPaletteDrag('filter', 100, 200);
      dragManager.updateDrag(150, 250);

      const state = dragManager.getDragState();
      expect(state!.mouseX).toBe(150);
      expect(state!.mouseY).toBe(250);
    });

    it('computes a drop target when over a column', () => {
      dragManager.startPaletteDrag('filter', 100, 200);
      // mouseX=100 is within column 0 (starts at x=20, width=280)
      dragManager.updateDrag(100, 50);

      const state = dragManager.getDragState();
      expect(state!.currentDropTarget).not.toBeNull();
      expect(state!.currentDropTarget!.columnIndex).toBe(0);
    });

    it('sets drop target to null when outside all columns', () => {
      dragManager.startPaletteDrag('filter', 100, 200);
      dragManager.updateDrag(5, 50); // left of canvas padding

      const state = dragManager.getDragState();
      expect(state!.currentDropTarget).toBeNull();
    });

    it('is a no-op when not dragging', () => {
      expect(() => dragManager.updateDrag(100, 200)).not.toThrow();
    });
  });

  describe('endDrag (palette → canvas)', () => {
    it('adds a block to the workspace at the drop target', () => {
      dragManager.startPaletteDrag('filter', 100, 200);
      dragManager.updateDrag(100, 50); // over column 0
      dragManager.endDrag();

      expect(workspaceManager.getColumn(0).blocks).toHaveLength(1);
      expect(workspaceManager.getColumn(0).blocks[0].definitionId).toBe('filter');
    });

    it('cleans up drag state after drop', () => {
      dragManager.startPaletteDrag('filter', 100, 200);
      dragManager.updateDrag(100, 50);
      dragManager.endDrag();

      expect(dragManager.isDragging()).toBe(false);
      expect(dragManager.getDragState()).toBeNull();
    });

    it('hides the ghost after drop', () => {
      dragManager.startPaletteDrag('filter', 100, 200);
      dragManager.updateDrag(100, 50);
      dragManager.endDrag();

      expect(ghostEl.style.display).toBe('none');
    });
  });

  describe('endDrag outside canvas', () => {
    it('does not add a block when dropped outside canvas', () => {
      dragManager.startPaletteDrag('filter', 100, 200);
      dragManager.updateDrag(5, 50); // outside canvas
      dragManager.endDrag();

      expect(workspaceManager.getColumn(0).blocks).toHaveLength(0);
    });
  });

  describe('endDrag (canvas reorder)', () => {
    it('moves a block to the drop target position', () => {
      const b0 = workspaceManager.addBlock('filter', 0, 0);
      workspaceManager.addBlock('log', 0, 1);
      workspaceManager.addBlock('log', 1, 0);

      const blockEl = document.createElement('div');
      dragManager.registerBlockElement(b0.id, blockEl);

      dragManager.startCanvasDrag(b0.id, 100, 30);
      // Move to column 1
      dragManager.updateDrag(400, 50);
      dragManager.endDrag();

      // b0 should now be in column 1
      expect(workspaceManager.getColumn(0).blocks).toHaveLength(1);
      expect(workspaceManager.getColumn(1).blocks).toHaveLength(2);
    });
  });

  describe('cancelDrag', () => {
    it('sets isDragging to false', () => {
      dragManager.startPaletteDrag('filter', 100, 200);
      dragManager.cancelDrag();
      expect(dragManager.isDragging()).toBe(false);
    });

    it('does not add a block', () => {
      dragManager.startPaletteDrag('filter', 100, 200);
      dragManager.updateDrag(100, 50);
      dragManager.cancelDrag();

      expect(workspaceManager.getColumn(0).blocks).toHaveLength(0);
    });

    it('restores original block opacity on canvas drag cancel', () => {
      const block = workspaceManager.addBlock('filter', 0, 0);
      const blockEl = document.createElement('div');
      dragManager.registerBlockElement(block.id, blockEl);

      dragManager.startCanvasDrag(block.id, 100, 30);
      expect(blockEl.style.opacity).toBe('0');

      dragManager.cancelDrag();
      expect(blockEl.style.opacity).toBe('1');
    });

    it('hides the ghost element', () => {
      dragManager.startPaletteDrag('filter', 100, 200);
      dragManager.cancelDrag();
      expect(ghostEl.style.display).toBe('none');
    });
  });
});
