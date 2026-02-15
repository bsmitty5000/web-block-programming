import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WorkspaceManager } from '../WorkspaceManager';
import { BlockRegistry } from '../BlockRegistry';
import { LayoutEngine } from '../LayoutEngine';
import { EventBus } from '../EventBus';
import { BlockDefinition, ParameterType } from '../../types/blocks';
import { WorkspaceConfig } from '../../types/workspace';

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

function makeConfig(overrides?: Partial<WorkspaceConfig>): WorkspaceConfig {
  return {
    columnCount: 3,
    columnWidthPx: 280,
    blockGapPx: 8,
    canvasPaddingPx: 20,
    ...overrides,
  };
}

// --- tests ---

describe('WorkspaceManager', () => {
  let registry: BlockRegistry;
  let layoutEngine: LayoutEngine;
  let events: EventBus;
  let manager: WorkspaceManager;
  let config: WorkspaceConfig;

  const filterDef = makeBlock({
    id: 'filter',
    category: 'Transform',
    parameters: [
      { id: 'field', name: 'Field', type: ParameterType.TEXT, defaultValue: '' },
      { id: 'operator', name: 'Operator', type: ParameterType.SELECT, defaultValue: 'equals',
        options: [{ label: 'Equals', value: 'equals' }, { label: 'Contains', value: 'contains' }] },
    ],
  });

  const logDef = makeBlock({ id: 'log', category: 'Output' });

  const sortDef = makeBlock({
    id: 'sort',
    category: 'Transform',
    parameters: [
      { id: 'direction', name: 'Direction', type: ParameterType.SELECT, defaultValue: 'asc',
        options: [{ label: 'Ascending', value: 'asc' }, { label: 'Descending', value: 'desc' }] },
    ],
  });

  beforeEach(() => {
    events = new EventBus();
    registry = new BlockRegistry(events);
    registry.register(filterDef);
    registry.register(logDef);
    registry.register(sortDef);
    config = makeConfig();
    layoutEngine = new LayoutEngine(registry);
    manager = new WorkspaceManager(config, registry, layoutEngine, events);
  });

  describe('constructor', () => {
    it('creates the correct number of empty columns', () => {
      expect(manager.getWorkspace().columns).toHaveLength(3);
      for (let i = 0; i < 3; i++) {
        expect(manager.getColumn(i).index).toBe(i);
        expect(manager.getColumn(i).blocks).toHaveLength(0);
      }
    });
  });

  describe('addBlock', () => {
    it('adds a block to the specified column', () => {
      const block = manager.addBlock('filter', 0, 0);
      expect(manager.getColumn(0).blocks).toHaveLength(1);
      expect(manager.getColumn(0).blocks[0]).toBe(block);
    });

    it('returns a block with the correct definitionId and columnIndex', () => {
      const block = manager.addBlock('filter', 1, 0);
      expect(block.definitionId).toBe('filter');
      expect(block.columnIndex).toBe(1);
      expect(block.orderIndex).toBe(0);
    });

    it('pre-fills parameterValues with defaults from the definition', () => {
      const block = manager.addBlock('filter', 0, 0);
      expect(block.parameterValues['field']).toBe('');
      expect(block.parameterValues['operator']).toBe('equals');
    });

    it('generates unique IDs for each block', () => {
      const b1 = manager.addBlock('filter', 0, 0);
      const b2 = manager.addBlock('log', 0, 1);
      expect(b1.id).not.toBe(b2.id);
    });

    it('maintains correct orderIndex values when inserting in the middle', () => {
      const b0 = manager.addBlock('filter', 0, 0);
      const b1 = manager.addBlock('log', 0, 1);
      const bMiddle = manager.addBlock('sort', 0, 1); // insert between b0 and b1

      const blocks = manager.getColumn(0).blocks;
      expect(blocks).toHaveLength(3);
      expect(blocks[0]).toBe(b0);
      expect(blocks[0].orderIndex).toBe(0);
      expect(blocks[1]).toBe(bMiddle);
      expect(blocks[1].orderIndex).toBe(1);
      expect(blocks[2]).toBe(b1);
      expect(blocks[2].orderIndex).toBe(2);
    });

    it('emits workspace:changed event', () => {
      const callback = vi.fn();
      events.on('workspace:changed', callback);
      manager.addBlock('filter', 0, 0);
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('removeBlock', () => {
    it('removes a block from its column', () => {
      const block = manager.addBlock('filter', 0, 0);
      manager.removeBlock(block.id);
      expect(manager.getColumn(0).blocks).toHaveLength(0);
    });

    it('updates orderIndex for remaining blocks', () => {
      const b0 = manager.addBlock('filter', 0, 0);
      const b1 = manager.addBlock('log', 0, 1);
      const b2 = manager.addBlock('sort', 0, 2);

      manager.removeBlock(b1.id);

      const blocks = manager.getColumn(0).blocks;
      expect(blocks).toHaveLength(2);
      expect(blocks[0]).toBe(b0);
      expect(blocks[0].orderIndex).toBe(0);
      expect(blocks[1]).toBe(b2);
      expect(blocks[1].orderIndex).toBe(1);
    });

    it('throws when removing a non-existent block', () => {
      expect(() => manager.removeBlock('nonexistent')).toThrow(
        'Block with ID "nonexistent" not found.'
      );
    });

    it('emits workspace:changed event', () => {
      const block = manager.addBlock('filter', 0, 0);
      const callback = vi.fn();
      events.on('workspace:changed', callback);
      manager.removeBlock(block.id);
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('moveBlock', () => {
    it('moves a block from one column to another', () => {
      const block = manager.addBlock('filter', 0, 0);
      manager.moveBlock(block.id, 1, 0);

      expect(manager.getColumn(0).blocks).toHaveLength(0);
      expect(manager.getColumn(1).blocks).toHaveLength(1);
      expect(manager.getColumn(1).blocks[0]).toBe(block);
      expect(block.columnIndex).toBe(1);
    });

    it('reorders within the same column (move down)', () => {
      const b0 = manager.addBlock('filter', 0, 0);
      const b1 = manager.addBlock('log', 0, 1);
      const b2 = manager.addBlock('sort', 0, 2);

      // Move b0 to after b2 (orderIndex 3 in original, adjusts to 2)
      manager.moveBlock(b0.id, 0, 3);

      const blocks = manager.getColumn(0).blocks;
      expect(blocks[0]).toBe(b1);
      expect(blocks[1]).toBe(b2);
      expect(blocks[2]).toBe(b0);
      expect(blocks[0].orderIndex).toBe(0);
      expect(blocks[1].orderIndex).toBe(1);
      expect(blocks[2].orderIndex).toBe(2);
    });

    it('reorders within the same column (move up)', () => {
      const b0 = manager.addBlock('filter', 0, 0);
      const b1 = manager.addBlock('log', 0, 1);
      const b2 = manager.addBlock('sort', 0, 2);

      // Move b2 to the top
      manager.moveBlock(b2.id, 0, 0);

      const blocks = manager.getColumn(0).blocks;
      expect(blocks[0]).toBe(b2);
      expect(blocks[1]).toBe(b0);
      expect(blocks[2]).toBe(b1);
    });

    it('updates orderIndex for both source and target columns', () => {
      manager.addBlock('filter', 0, 0);
      const b1 = manager.addBlock('log', 0, 1);
      manager.addBlock('sort', 1, 0);

      manager.moveBlock(b1.id, 1, 0);

      // Source column: only b0 remains
      expect(manager.getColumn(0).blocks).toHaveLength(1);
      expect(manager.getColumn(0).blocks[0].orderIndex).toBe(0);

      // Target column: b1 inserted at 0, sort pushed to 1
      expect(manager.getColumn(1).blocks).toHaveLength(2);
      expect(manager.getColumn(1).blocks[0]).toBe(b1);
      expect(manager.getColumn(1).blocks[0].orderIndex).toBe(0);
      expect(manager.getColumn(1).blocks[1].orderIndex).toBe(1);
    });

    it('throws when moving a non-existent block', () => {
      expect(() => manager.moveBlock('nonexistent', 0, 0)).toThrow(
        'Block with ID "nonexistent" not found.'
      );
    });

    it('emits workspace:changed event', () => {
      const block = manager.addBlock('filter', 0, 0);
      const callback = vi.fn();
      events.on('workspace:changed', callback);
      manager.moveBlock(block.id, 1, 0);
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('copyBlock', () => {
    it('creates a new block directly below the original', () => {
      const original = manager.addBlock('filter', 0, 0);
      const copy = manager.copyBlock(original.id);

      const blocks = manager.getColumn(0).blocks;
      expect(blocks).toHaveLength(2);
      expect(blocks[0]).toBe(original);
      expect(blocks[1]).toBe(copy);
    });

    it('gives the copy a different ID but same definitionId', () => {
      const original = manager.addBlock('filter', 0, 0);
      const copy = manager.copyBlock(original.id);

      expect(copy.id).not.toBe(original.id);
      expect(copy.definitionId).toBe(original.definitionId);
    });

    it('deep-copies parameterValues from the original', () => {
      const original = manager.addBlock('filter', 0, 0);
      manager.updateParameter(original.id, 'field', 'name');
      manager.updateParameter(original.id, 'operator', 'contains');

      const copy = manager.copyBlock(original.id);

      expect(copy.parameterValues['field']).toBe('name');
      expect(copy.parameterValues['operator']).toBe('contains');

      // Verify it's a deep copy — changing original doesn't affect copy
      manager.updateParameter(original.id, 'field', 'changed');
      expect(copy.parameterValues['field']).toBe('name');
    });
  });

  describe('updateParameter', () => {
    it('updates the parameter value on the block', () => {
      const block = manager.addBlock('filter', 0, 0);
      manager.updateParameter(block.id, 'field', 'username');
      expect(block.parameterValues['field']).toBe('username');
    });

    it('emits workspace:changed event', () => {
      const block = manager.addBlock('filter', 0, 0);
      const callback = vi.fn();
      events.on('workspace:changed', callback);
      manager.updateParameter(block.id, 'field', 'test');
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('getBlock', () => {
    it('finds a block by ID across any column', () => {
      const b0 = manager.addBlock('filter', 0, 0);
      const b1 = manager.addBlock('log', 2, 0);

      expect(manager.getBlock(b0.id)).toBe(b0);
      expect(manager.getBlock(b1.id)).toBe(b1);
    });

    it('throws for a non-existent ID', () => {
      expect(() => manager.getBlock('nonexistent')).toThrow(
        'Block with ID "nonexistent" not found.'
      );
    });
  });

  describe('onStateChange', () => {
    it('calls the callback when workspace changes', () => {
      const callback = vi.fn();
      manager.onStateChange(callback);
      manager.addBlock('filter', 0, 0);
      expect(callback).toHaveBeenCalled();
    });
  });

  describe('reflowColumn', () => {
    it('sets correct top positions on registered block elements', () => {
      const colEl = document.createElement('div');
      manager.registerColumnElement(0, colEl);

      // Add first block and register its element immediately
      const b0 = manager.addBlock('log', 0, 0);       // 0 params → height 44
      const el0 = document.createElement('div');
      manager.registerBlockElement(b0.id, el0);

      // Add second block — reflow now sees el0
      const b1 = manager.addBlock('filter', 0, 1);    // 2 params → height 108
      const el1 = document.createElement('div');
      manager.registerBlockElement(b1.id, el1);

      // Add third block — reflow now sees el0 and el1
      const b2 = manager.addBlock('sort', 0, 2);      // 1 param → height 76
      const el2 = document.createElement('div');
      manager.registerBlockElement(b2.id, el2);

      // el2 was registered after the last reflow, so trigger one more
      // by adding and removing a throwaway block
      const tmp = manager.addBlock('log', 0, 3);
      manager.removeBlock(tmp.id);

      // b0: y = COLUMN_HEADER + canvasPaddingPx = 35 + 20 = 55
      expect(el0.style.top).toBe('55px');
      // b1: y = 55 + (44 + 8) = 107
      expect(el1.style.top).toBe('107px');
      // b2: y = 107 + (108 + 8) = 223
      expect(el2.style.top).toBe('223px');
    });

    it('updates positions after a block is removed', () => {
      const b0 = manager.addBlock('log', 0, 0);
      const b1 = manager.addBlock('filter', 0, 1);
      const b2 = manager.addBlock('sort', 0, 2);

      const el0 = document.createElement('div');
      const el1 = document.createElement('div');
      const el2 = document.createElement('div');
      manager.registerBlockElement(b0.id, el0);
      manager.registerBlockElement(b1.id, el1);
      manager.registerBlockElement(b2.id, el2);

      // Force a reflow so initial positions are set
      manager.updateParameter(b0.id, 'dummy', 'x');

      // Remove middle block
      manager.removeBlock(b1.id);

      // b0 stays at 55
      expect(el0.style.top).toBe('55px');
      // b2 moves up: 55 + (44 + 8) = 107
      expect(el2.style.top).toBe('107px');
    });
  });
});
