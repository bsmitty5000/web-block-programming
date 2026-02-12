import { describe, it, expect, beforeEach } from 'vitest';
import { BlockRegistry } from '../BlockRegistry';
import { BlockDefinition, BlockDefinitionConfig, ParameterType } from '../../types/blocks';

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

describe('BlockRegistry', () => {
  let registry: BlockRegistry;

  beforeEach(() => {
    registry = new BlockRegistry();
  });

  describe('register & get', () => {
    it('registers a definition and retrieves it by ID', () => {
      const block = makeBlock({ id: 'filter', category: 'Transform' });
      registry.register(block);
      const result = registry.get('filter');
      expect(result).toBe(block);
    });
  });

  describe('duplicate ID', () => {
    it('throws when registering the same ID twice', () => {
      const block = makeBlock({ id: 'filter' });
      registry.register(block);
      expect(() => registry.register(block)).toThrow(
        'Block definition with ID "filter" already exists.'
      );
    });
  });

  describe('not found', () => {
    it('throws when getting a non-existent ID', () => {
      expect(() => registry.get('nonexistent')).toThrow(
        'No block definition with "nonexistent" found in registry.'
      );
    });
  });

  describe('getByCategory', () => {
    it('returns blocks in the requested category only', () => {
      const filter = makeBlock({ id: 'filter', category: 'Transform' });
      const sort = makeBlock({ id: 'sort', category: 'Transform' });
      const readFile = makeBlock({ id: 'read-file', category: 'Input' });

      registry.register(filter);
      registry.register(sort);
      registry.register(readFile);

      const transforms = registry.getByCategory('Transform');
      expect(transforms).toHaveLength(2);
      expect(transforms).toContain(filter);
      expect(transforms).toContain(sort);

      const inputs = registry.getByCategory('Input');
      expect(inputs).toHaveLength(1);
      expect(inputs).toContain(readFile);
    });

    it('returns an empty array for a category with no blocks', () => {
      registry.register(makeBlock({ id: 'filter', category: 'Transform' }));
      expect(registry.getByCategory('Output')).toEqual([]);
    });
  });

  describe('getCategories', () => {
    it('returns sorted unique category names', () => {
      registry.register(makeBlock({ id: 'filter', category: 'Transform' }));
      registry.register(makeBlock({ id: 'sort', category: 'Transform' }));
      registry.register(makeBlock({ id: 'read-file', category: 'Input' }));
      registry.register(makeBlock({ id: 'write-file', category: 'Output' }));

      expect(registry.getCategories()).toEqual(['Input', 'Output', 'Transform']);
    });

    it('returns an empty array when no blocks are registered', () => {
      expect(registry.getCategories()).toEqual([]);
    });
  });

  describe('getAll', () => {
    it('returns all registered definitions', () => {
      const filter = makeBlock({ id: 'filter' });
      const sort = makeBlock({ id: 'sort' });
      registry.register(filter);
      registry.register(sort);

      const all = registry.getAll();
      expect(all).toHaveLength(2);
      expect(all).toContain(filter);
      expect(all).toContain(sort);
    });

    it('returns an empty array when no blocks are registered', () => {
      expect(registry.getAll()).toEqual([]);
    });
  });

  describe('loadFromConfig', () => {
    it('loads all blocks from a config object', () => {
      const config: BlockDefinitionConfig = {
        blocks: [
          makeBlock({ id: 'read-file', name: 'Read File', category: 'Input' }),
          makeBlock({ id: 'http-request', name: 'HTTP Request', category: 'Input' }),
          makeBlock({
            id: 'filter',
            name: 'Filter',
            category: 'Transform',
            color: '#4A90D9',
            parameters: [
              {
                id: 'field',
                name: 'Field',
                type: ParameterType.TEXT,
                defaultValue: '',
                validation: { required: true },
              },
              {
                id: 'operator',
                name: 'Operator',
                type: ParameterType.SELECT,
                defaultValue: 'equals',
                options: [
                  { label: 'Equals', value: 'equals' },
                  { label: 'Contains', value: 'contains' },
                ],
              },
            ],
          }),
          makeBlock({ id: 'sort', name: 'Sort', category: 'Transform' }),
          makeBlock({ id: 'map', name: 'Map', category: 'Transform' }),
          makeBlock({ id: 'write-file', name: 'Write File', category: 'Output' }),
          makeBlock({ id: 'log', name: 'Log', category: 'Output' }),
          makeBlock({ id: 'send-email', name: 'Send Email', category: 'Output' }),
        ],
      };

      registry.loadFromConfig(config);

      expect(registry.getAll()).toHaveLength(8);
      expect(registry.getCategories()).toEqual(['Input', 'Output', 'Transform']);
      expect(registry.get('filter').name).toBe('Filter');
      expect(registry.get('filter').parameters).toHaveLength(2);
      expect(registry.getByCategory('Input')).toHaveLength(2);
      expect(registry.getByCategory('Transform')).toHaveLength(3);
      expect(registry.getByCategory('Output')).toHaveLength(3);
    });

    it('throws on duplicate IDs within the config', () => {
      const config: BlockDefinitionConfig = {
        blocks: [
          makeBlock({ id: 'filter' }),
          makeBlock({ id: 'filter' }),
        ],
      };

      expect(() => registry.loadFromConfig(config)).toThrow(
        'Block definition with ID "filter" already exists.'
      );
    });
  });
});
