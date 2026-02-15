import { describe, it, expect, beforeEach } from 'vitest';
import { LayoutEngine } from '../LayoutEngine';
import { BlockRegistry } from '../BlockRegistry';
import { EventBus } from '../EventBus';
import { BlockDefinition, ParameterType } from '../../types/blocks';
import { BlockInstance, Column, Workspace, WorkspaceConfig } from '../../types/workspace';

// --- helpers ---

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

function makeInstance(overrides: Partial<BlockInstance> & { id: string; definitionId: string }): BlockInstance {
  return {
    columnIndex: 0,
    orderIndex: 0,
    parameterValues: {},
    ...overrides,
  };
}

function makeConfig(overrides?: Partial<WorkspaceConfig>): WorkspaceConfig {
  return {
    columnCount: 3,
    columnWidthPx: 280,
    blockGapPx: 8,
    canvasPaddingPx: 20,
    ...overrides,
  };
}

function makeWorkspace(columns: Column[], config?: WorkspaceConfig): Workspace {
  return {
    columns,
    config: config ?? makeConfig(),
  };
}

// --- tests ---

describe('LayoutEngine', () => {
  let registry: BlockRegistry;
  let engine: LayoutEngine;

  // Blocks with known parameter counts for predictable heights
  const zeroDef = makeBlock({ id: 'zero-params' });
  const oneDef = makeBlock({
    id: 'one-param',
    parameters: [
      { id: 'p1', name: 'P1', type: ParameterType.TEXT, defaultValue: '' },
    ],
  });
  const threeDef = makeBlock({
    id: 'three-params',
    parameters: [
      { id: 'p1', name: 'P1', type: ParameterType.TEXT, defaultValue: '' },
      { id: 'p2', name: 'P2', type: ParameterType.NUMBER, defaultValue: 0 },
      { id: 'p3', name: 'P3', type: ParameterType.BOOLEAN, defaultValue: false },
    ],
  });

  beforeEach(() => {
    const events = new EventBus();
    registry = new BlockRegistry(events);
    registry.register(zeroDef);
    registry.register(oneDef);
    registry.register(threeDef);
    engine = new LayoutEngine(registry);
  });

  describe('calculateColumnX', () => {
    it('returns canvasPaddingPx for column 0', () => {
      const config = makeConfig({ canvasPaddingPx: 20, columnWidthPx: 280 });
      expect(engine.calculateColumnX(0, config)).toBe(20);
    });

    it('accounts for column width and gap for column 1', () => {
      const config = makeConfig({ canvasPaddingPx: 20, columnWidthPx: 280 });
      // 20 + 1 * (280 + 16) = 316
      expect(engine.calculateColumnX(1, config)).toBe(316);
    });

    it('accounts for column width and gap for column 2', () => {
      const config = makeConfig({ canvasPaddingPx: 20, columnWidthPx: 280 });
      // 20 + 2 * (280 + 16) = 612
      expect(engine.calculateColumnX(2, config)).toBe(612);
    });
  });

  describe('getBlockHeight', () => {
    it('returns header + padding for a block with 0 parameters', () => {
      const instance = makeInstance({ id: 'b1', definitionId: 'zero-params' });
      // 36 + 0*32 + 8 = 44
      expect(engine.getBlockHeight(instance)).toBe(44);
    });

    it('returns header + 1 param row + padding for 1 parameter', () => {
      const instance = makeInstance({ id: 'b1', definitionId: 'one-param' });
      // 36 + 1*32 + 8 = 76
      expect(engine.getBlockHeight(instance)).toBe(76);
    });

    it('returns header + 3 param rows + padding for 3 parameters', () => {
      const instance = makeInstance({ id: 'b1', definitionId: 'three-params' });
      // 36 + 3*32 + 8 = 140
      expect(engine.getBlockHeight(instance)).toBe(140);
    });
  });

  describe('calculateBlockY', () => {
    it('returns column header height + canvasPaddingPx for the first block (orderIndex 0)', () => {
      const config = makeConfig({ canvasPaddingPx: 20 });
      const column: Column = { index: 0, blocks: [] };
      // 35 + 20 = 55
      expect(engine.calculateBlockY(0, column, config)).toBe(55);
    });

    it('returns correct y for the second block after a 0-param block', () => {
      const config = makeConfig({ canvasPaddingPx: 20, blockGapPx: 8 });
      const block0 = makeInstance({ id: 'b0', definitionId: 'zero-params', orderIndex: 0 });
      const column: Column = { index: 0, blocks: [block0] };
      // 35 + 20 + (44 + 8) = 107
      expect(engine.calculateBlockY(1, column, config)).toBe(107);
    });

    it('sums heights of all preceding blocks', () => {
      const config = makeConfig({ canvasPaddingPx: 20, blockGapPx: 8 });
      const block0 = makeInstance({ id: 'b0', definitionId: 'zero-params', orderIndex: 0 });
      const block1 = makeInstance({ id: 'b1', definitionId: 'three-params', orderIndex: 1 });
      const column: Column = { index: 0, blocks: [block0, block1] };
      // 35 + 20 + (44 + 8) + (140 + 8) = 255
      expect(engine.calculateBlockY(2, column, config)).toBe(255);
    });
  });

  describe('calculateBlockPosition', () => {
    it('returns combined x and y position for a block', () => {
      const config = makeConfig({ canvasPaddingPx: 20, columnWidthPx: 280, blockGapPx: 8 });
      const block0 = makeInstance({ id: 'b0', definitionId: 'zero-params', columnIndex: 1, orderIndex: 0 });
      const block1 = makeInstance({ id: 'b1', definitionId: 'one-param', columnIndex: 1, orderIndex: 1 });
      const workspace = makeWorkspace([
        { index: 0, blocks: [] },
        { index: 1, blocks: [block0, block1] },
        { index: 2, blocks: [] },
      ], config);

      const pos = engine.calculateBlockPosition(block1, workspace);
      expect(pos.x).toBe(316);  // 20 + 1*(280+16)
      expect(pos.y).toBe(107);  // 35 + 20 + (44 + 8)
    });
  });

  describe('getDropTarget', () => {
    let config: WorkspaceConfig;
    let block0: BlockInstance;
    let block1: BlockInstance;
    let workspace: Workspace;

    beforeEach(() => {
      config = makeConfig({ canvasPaddingPx: 20, columnWidthPx: 280, blockGapPx: 8 });
      block0 = makeInstance({ id: 'b0', definitionId: 'zero-params', columnIndex: 0, orderIndex: 0 });
      block1 = makeInstance({ id: 'b1', definitionId: 'one-param', columnIndex: 0, orderIndex: 1 });
      workspace = makeWorkspace([
        { index: 0, blocks: [block0, block1] },
        { index: 1, blocks: [] },
        { index: 2, blocks: [] },
      ], config);
    });

    it('returns null when mouse is left of the canvas (before padding)', () => {
      expect(engine.getDropTarget(5, 50, workspace)).toBeNull();
    });

    it('returns null when mouse is in the gap between columns', () => {
      // Column 0 spans x: 20..300. Gap is 300..316. Column 1 starts at 316.
      expect(engine.getDropTarget(305, 50, workspace)).toBeNull();
    });

    it('returns null when mouse is past the last column', () => {
      // 3 columns: 0 starts at 20, 1 at 316, 2 at 612. Column 2 ends at 892.
      expect(engine.getDropTarget(900, 50, workspace)).toBeNull();
    });

    it('returns orderIndex 0 when mouse is above the midpoint of the first block', () => {
      // Block 0 starts at y=55, height=44, midpoint=77
      const result = engine.getDropTarget(100, 60, workspace);
      expect(result).not.toBeNull();
      expect(result!.columnIndex).toBe(0);
      expect(result!.orderIndex).toBe(0);
    });

    it('returns orderIndex 1 when mouse is below the midpoint of the first block', () => {
      // Block 0 starts at y=55, height=44, midpoint=77
      const result = engine.getDropTarget(100, 85, workspace);
      expect(result).not.toBeNull();
      expect(result!.columnIndex).toBe(0);
      expect(result!.orderIndex).toBe(1);
    });

    it('returns orderIndex 2 (end) when mouse is below the midpoint of the last block', () => {
      // Block 1 starts at y=107, height=76, midpoint=145
      const result = engine.getDropTarget(100, 155, workspace);
      expect(result).not.toBeNull();
      expect(result!.columnIndex).toBe(0);
      expect(result!.orderIndex).toBe(2);
    });

    it('returns insert at end when mouse is well below all blocks', () => {
      const result = engine.getDropTarget(100, 500, workspace);
      expect(result).not.toBeNull();
      expect(result!.columnIndex).toBe(0);
      expect(result!.orderIndex).toBe(2);
    });

    it('targets the correct column based on mouseX', () => {
      // Column 1 starts at x=316
      const result = engine.getDropTarget(400, 50, workspace);
      expect(result).not.toBeNull();
      expect(result!.columnIndex).toBe(1);
    });

    it('returns orderIndex 0 for an empty column', () => {
      // Column 1 is empty, mouse at x=400 (in column 1)
      const result = engine.getDropTarget(400, 50, workspace);
      expect(result).not.toBeNull();
      expect(result!.columnIndex).toBe(1);
      expect(result!.orderIndex).toBe(0);
    });

    it('sets indicatorY at the seam between blocks', () => {
      // Mouse below midpoint of block 0 → insert at orderIndex 1
      // Block 1 starts at y=107, indicatorY should be 107 - blockGapPx/2 = 103
      const result = engine.getDropTarget(100, 85, workspace);
      expect(result).not.toBeNull();
      expect(result!.indicatorY).toBe(103);
    });

    it('sets indicatorY at the calculated position for end-of-column insert', () => {
      // Insert at end (orderIndex 2), indicatorY = calculateBlockY(2, ...)
      // = 35 + 20 + (44 + 8) + (76 + 8) = 191
      const result = engine.getDropTarget(100, 500, workspace);
      expect(result).not.toBeNull();
      expect(result!.indicatorY).toBe(191);
    });
  });
});
