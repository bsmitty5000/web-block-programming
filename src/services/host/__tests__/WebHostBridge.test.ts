import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WebHostBridge } from '../WebHostBridge';
import { SerializationService } from '../../SerializationService';
import { BlockRegistry } from '../../BlockRegistry';
import { EventBus } from '../../EventBus';
import { Workspace } from '../../../types/workspace';
import { BlockDefinition } from '../../../types/blocks';

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

function makeWorkspace(): Workspace {
  return {
    config: {
      columnCount: 2,
      columnWidthPx: 280,
      blockGapPx: 12,
      canvasPaddingPx: 20,
    },
    columns: [
      {
        index: 0,
        blocks: [
          { id: 'block-1', definitionId: 'filter', columnIndex: 0, orderIndex: 0, parameterValues: { field: 'name' } },
        ],
      },
      { index: 1, blocks: [] },
    ],
  };
}

describe('WebHostBridge', () => {
  let bridge: WebHostBridge;
  let serializer: SerializationService;
  let registry: BlockRegistry;

  beforeEach(() => {
    localStorage.clear();
    serializer = new SerializationService();
    const events = new EventBus();
    registry = new BlockRegistry(events);
    registry.register(makeBlock({ id: 'filter', category: 'Transform' }));
    bridge = new WebHostBridge(serializer, registry);
  });

  describe('sendState', () => {
    it('writes serialized workspace to localStorage', () => {
      const workspace = makeWorkspace();
      bridge.sendState(workspace);

      const stored = localStorage.getItem('block-programming-workspace');
      expect(stored).not.toBeNull();

      const parsed = JSON.parse(stored!);
      expect(parsed.version).toBe(1);
      expect(parsed.config.columnCount).toBe(2);
      expect(parsed.columns[0]).toHaveLength(1);
      expect(parsed.columns[0][0].id).toBe('block-1');
    });
  });

  describe('requestLoad', () => {
    it('deserializes localStorage and calls loadCallback', () => {
      const workspace = makeWorkspace();
      const json = serializer.serialize(workspace);
      localStorage.setItem('block-programming-workspace', json);

      const callback = vi.fn();
      bridge.onLoadState(callback);
      bridge.requestLoad();

      expect(callback).toHaveBeenCalledOnce();
      const loaded = callback.mock.calls[0][0] as Workspace;
      expect(loaded.config.columnCount).toBe(2);
      expect(loaded.columns[0].blocks).toHaveLength(1);
      expect(loaded.columns[0].blocks[0].id).toBe('block-1');
      expect(loaded.columns[0].blocks[0].parameterValues).toEqual({ field: 'name' });
    });

    it('does not call callback when localStorage is empty', () => {
      const callback = vi.fn();
      bridge.onLoadState(callback);
      bridge.requestLoad();

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('requestSave', () => {
    it('re-saves the last workspace sent via sendState', () => {
      const workspace = makeWorkspace();
      bridge.sendState(workspace);

      localStorage.clear();
      expect(localStorage.getItem('block-programming-workspace')).toBeNull();

      bridge.requestSave();

      const stored = localStorage.getItem('block-programming-workspace');
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.columns[0][0].id).toBe('block-1');
    });

    it('does nothing if sendState was never called', () => {
      bridge.requestSave();
      expect(localStorage.getItem('block-programming-workspace')).toBeNull();
    });
  });
});
