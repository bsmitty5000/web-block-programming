import { describe, it, expect, beforeEach } from 'vitest';
import { SerializationService } from '../SerializationService';
import { BlockRegistry } from '../BlockRegistry';
import { EventBus } from '../EventBus';
import { Workspace } from '../../types/workspace';
import { BlockDefinition, ParameterType } from '../../types/blocks';

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

function makeWorkspace(blocks?: { col: number; id: string; defId: string; params?: Record<string, unknown> }[]): Workspace {
  const config = {
    columnCount: 3,
    columnWidthPx: 280,
    blockGapPx: 12,
    canvasPaddingPx: 20,
  };

  const columns = [
    { index: 0, blocks: [] as Workspace['columns'][0]['blocks'] },
    { index: 1, blocks: [] as Workspace['columns'][0]['blocks'] },
    { index: 2, blocks: [] as Workspace['columns'][0]['blocks'] },
  ];

  if (blocks)
  {
    for (const b of blocks)
    {
      const col = columns[b.col];
      col.blocks.push({
        id: b.id,
        definitionId: b.defId,
        columnIndex: b.col,
        orderIndex: col.blocks.length,
        parameterValues: b.params ?? {},
      });
    }
  }

  return { columns, config };
}

describe('SerializationService', () => {
  let service: SerializationService;
  let registry: BlockRegistry;

  beforeEach(() => {
    service = new SerializationService();
    const events = new EventBus();
    registry = new BlockRegistry(events);
    registry.register(makeBlock({
      id: 'filter',
      name: 'Filter',
      category: 'Transform',
      parameters: [
        { id: 'field', name: 'Field', type: ParameterType.TEXT, defaultValue: '' },
        { id: 'operator', name: 'Operator', type: ParameterType.SELECT, defaultValue: 'equals', options: [{ label: 'Equals', value: 'equals' }] },
      ],
    }));
    registry.register(makeBlock({ id: 'log', name: 'Log', category: 'Output' }));
    registry.register(makeBlock({ id: 'sort', name: 'Sort', category: 'Transform' }));
  });

  describe('round-trip', () => {
    it('serialize then deserialize produces equivalent workspace', () => {
      const workspace = makeWorkspace([
        { col: 0, id: 'block-1', defId: 'filter', params: { field: 'name', operator: 'equals' } },
        { col: 0, id: 'block-2', defId: 'log' },
        { col: 1, id: 'block-3', defId: 'sort', params: { direction: 'asc' } },
      ]);

      const json = service.serialize(workspace);
      const restored = service.deserialize(json, registry);

      expect(restored.config).toEqual(workspace.config);
      expect(restored.columns).toHaveLength(3);
      expect(restored.columns[0].blocks).toHaveLength(2);
      expect(restored.columns[1].blocks).toHaveLength(1);
      expect(restored.columns[2].blocks).toHaveLength(0);

      const block1 = restored.columns[0].blocks[0];
      expect(block1.id).toBe('block-1');
      expect(block1.definitionId).toBe('filter');
      expect(block1.columnIndex).toBe(0);
      expect(block1.orderIndex).toBe(0);
      expect(block1.parameterValues).toEqual({ field: 'name', operator: 'equals' });

      const block3 = restored.columns[1].blocks[0];
      expect(block3.id).toBe('block-3');
      expect(block3.columnIndex).toBe(1);
      expect(block3.orderIndex).toBe(0);
    });
  });

  describe('version field', () => {
    it('serialized output includes version 1', () => {
      const workspace = makeWorkspace();
      const json = service.serialize(workspace);
      const parsed = JSON.parse(json);
      expect(parsed.version).toBe(1);
    });
  });

  describe('no columnIndex/orderIndex in serialized blocks', () => {
    it('omits positional fields from block output', () => {
      const workspace = makeWorkspace([
        { col: 0, id: 'block-1', defId: 'filter' },
      ]);

      const json = service.serialize(workspace);
      const parsed = JSON.parse(json);
      const serializedBlock = parsed.columns[0][0];

      expect(serializedBlock).toHaveProperty('id');
      expect(serializedBlock).toHaveProperty('definitionId');
      expect(serializedBlock).toHaveProperty('parameterValues');
      expect(serializedBlock).not.toHaveProperty('columnIndex');
      expect(serializedBlock).not.toHaveProperty('orderIndex');
    });
  });

  describe('invalid JSON', () => {
    it('throws when deserializing garbage input', () => {
      expect(() => service.deserialize('not-json!!!', registry)).toThrow();
    });
  });

  describe('unsupported version', () => {
    it('throws when version is not 1', () => {
      const json = JSON.stringify({ version: 99, config: {}, columns: [] });
      expect(() => service.deserialize(json, registry)).toThrow('Unsupported version: 99');
    });
  });

  describe('unknown definitionId', () => {
    it('throws when a block references an unregistered definition', () => {
      const json = JSON.stringify({
        version: 1,
        config: { columnCount: 1, columnWidthPx: 280, blockGapPx: 12, canvasPaddingPx: 20 },
        columns: [[{ id: 'block-1', definitionId: 'nonexistent', parameterValues: {} }]],
      });

      expect(() => service.deserialize(json, registry)).toThrow();
    });
  });

  describe('empty workspace', () => {
    it('round-trips a workspace with no blocks', () => {
      const workspace = makeWorkspace();
      const json = service.serialize(workspace);
      const restored = service.deserialize(json, registry);

      expect(restored.config).toEqual(workspace.config);
      expect(restored.columns).toHaveLength(3);
      restored.columns.forEach(col => {
        expect(col.blocks).toHaveLength(0);
      });
    });
  });

  describe('validate', () => {
    it('returns valid for well-formed JSON', () => {
      const workspace = makeWorkspace([
        { col: 0, id: 'block-1', defId: 'filter' },
      ]);
      const json = service.serialize(workspace);
      const result = service.validate(json);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('returns invalid for bad JSON syntax', () => {
      const result = service.validate('not json{{{');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid JSON syntax');
    });

    it('returns error for missing version', () => {
      const json = JSON.stringify({ config: { columnCount: 1, columnWidthPx: 1, blockGapPx: 1, canvasPaddingPx: 1 }, columns: [] });
      const result = service.validate(json);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('version'))).toBe(true);
    });

    it('returns error for missing columns', () => {
      const json = JSON.stringify({ version: 1, config: { columnCount: 1, columnWidthPx: 1, blockGapPx: 1, canvasPaddingPx: 1 } });
      const result = service.validate(json);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('columns'))).toBe(true);
    });

    it('returns error for missing config fields', () => {
      const json = JSON.stringify({ version: 1, config: { columnCount: 3 }, columns: [] });
      const result = service.validate(json);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('columnWidthPx'))).toBe(true);
      expect(result.errors.some(e => e.includes('blockGapPx'))).toBe(true);
      expect(result.errors.some(e => e.includes('canvasPaddingPx'))).toBe(true);
    });

    it('returns error for missing config entirely', () => {
      const json = JSON.stringify({ version: 1, columns: [] });
      const result = service.validate(json);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('config'))).toBe(true);
    });

    it('collects multiple errors at once', () => {
      const json = JSON.stringify({ config: 'not-an-object' });
      const result = service.validate(json);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
    });
  });
});
