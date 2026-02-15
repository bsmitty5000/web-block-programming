import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { VSCodeHostBridge } from '../VSCodeHostBridge';
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

const mockPostMessage = vi.fn();
const mockGetState = vi.fn();
const mockSetState = vi.fn();

function installMockVsCodeApi(): void {
  (globalThis as Record<string, unknown>).acquireVsCodeApi = () => ({
    postMessage: mockPostMessage,
    getState: mockGetState,
    setState: mockSetState,
  });
}

function removeMockVsCodeApi(): void {
  delete (globalThis as Record<string, unknown>).acquireVsCodeApi;
}

describe('VSCodeHostBridge', () => {
  let bridge: VSCodeHostBridge;
  let serializer: SerializationService;
  let registry: BlockRegistry;

  beforeEach(() => {
    mockPostMessage.mockClear();
    mockGetState.mockClear();
    mockSetState.mockClear();
    mockGetState.mockReturnValue(undefined);

    installMockVsCodeApi();

    serializer = new SerializationService();
    const events = new EventBus();
    registry = new BlockRegistry(events);
    registry.register(makeBlock({ id: 'filter', category: 'Transform' }));
    bridge = new VSCodeHostBridge(serializer, registry);
  });

  afterEach(() => {
    removeMockVsCodeApi();
  });

  describe('sendState', () => {
    it('posts a save message and persists via setState', () => {
      const workspace = makeWorkspace();
      bridge.sendState(workspace);

      expect(mockPostMessage).toHaveBeenCalledOnce();
      const message = mockPostMessage.mock.calls[0][0];
      expect(message.type).toBe('save');
      expect(message.payload).toBeDefined();

      const parsed = JSON.parse(message.payload);
      expect(parsed.version).toBe(1);
      expect(parsed.columns[0][0].id).toBe('block-1');

      expect(mockSetState).toHaveBeenCalledOnce();
      expect(mockSetState.mock.calls[0][0]).toBe(message.payload);
    });
  });

  describe('onLoadState + message listener', () => {
    it('calls loadCallback when a load message arrives', () => {
      const workspace = makeWorkspace();
      const json = serializer.serialize(workspace);

      const callback = vi.fn();
      bridge.onLoadState(callback);

      window.dispatchEvent(new MessageEvent('message', {
        data: { type: 'load', payload: json },
      }));

      expect(callback).toHaveBeenCalledOnce();
      const loaded = callback.mock.calls[0][0] as Workspace;
      expect(loaded.config.columnCount).toBe(2);
      expect(loaded.columns[0].blocks[0].id).toBe('block-1');
    });

    it('does not call callback for non-load messages', () => {
      const callback = vi.fn();
      bridge.onLoadState(callback);

      window.dispatchEvent(new MessageEvent('message', {
        data: { type: 'config', payload: { blocks: [] } },
      }));

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('requestSave', () => {
    it('posts a ready message', () => {
      bridge.requestSave();

      expect(mockPostMessage).toHaveBeenCalledOnce();
      expect(mockPostMessage.mock.calls[0][0]).toEqual({ type: 'ready' });
    });
  });

  describe('requestLoad', () => {
    it('loads from getState when persisted state exists', () => {
      const workspace = makeWorkspace();
      const json = serializer.serialize(workspace);
      mockGetState.mockReturnValue(json);

      const callback = vi.fn();
      bridge.onLoadState(callback);

      // Need a fresh bridge so getState returns our value during requestLoad
      bridge = new VSCodeHostBridge(serializer, registry);
      bridge.onLoadState(callback);
      bridge.requestLoad();

      expect(callback).toHaveBeenCalledOnce();
      const loaded = callback.mock.calls[0][0] as Workspace;
      expect(loaded.columns[0].blocks[0].id).toBe('block-1');
    });

    it('posts ready message when no persisted state exists', () => {
      mockGetState.mockReturnValue(undefined);
      mockPostMessage.mockClear();

      bridge.requestLoad();

      expect(mockPostMessage).toHaveBeenCalledWith({ type: 'ready' });
    });
  });
});
