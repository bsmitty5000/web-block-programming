import { describe, it, expect } from 'vitest';
import {
  BlockInstance,
  Column,
  WorkspaceConfig,
  Workspace,
} from '../workspace';

describe('BlockInstance interface', () => {
  it('can create an object with required fields', () => {
    const instance: BlockInstance = {
      id: 'inst-001',
      definitionId: 'filter',
      columnIndex: 0,
      orderIndex: 0,
      parameterValues: {},
    };
    expect(instance.id).toBe('inst-001');
    expect(instance.definitionId).toBe('filter');
    expect(instance.columnIndex).toBe(0);
    expect(instance.orderIndex).toBe(0);
    expect(instance.parameterValues).toEqual({});
  });

  it('can create an object with parameter values', () => {
    const instance: BlockInstance = {
      id: 'inst-002',
      definitionId: 'filter',
      columnIndex: 1,
      orderIndex: 2,
      parameterValues: {
        field: 'status',
        operator: 'equals',
        value: 'active',
      },
    };
    expect(instance.parameterValues.field).toBe('status');
    expect(instance.parameterValues.operator).toBe('equals');
    expect(instance.parameterValues.value).toBe('active');
  });
});

describe('Column interface', () => {
  it('can create an object with empty blocks array', () => {
    const column: Column = {
      index: 0,
      blocks: [],
    };
    expect(column.index).toBe(0);
    expect(column.blocks).toEqual([]);
  });

  it('can create an object with multiple block instances', () => {
    const column: Column = {
      index: 0,
      blocks: [
        {
          id: 'inst-001',
          definitionId: 'filter',
          columnIndex: 0,
          orderIndex: 0,
          parameterValues: { field: 'status' },
        },
        {
          id: 'inst-002',
          definitionId: 'sort',
          columnIndex: 0,
          orderIndex: 1,
          parameterValues: { field: 'name' },
        },
      ],
    };
    expect(column.blocks).toHaveLength(2);
    expect(column.blocks[0].id).toBe('inst-001');
    expect(column.blocks[1].id).toBe('inst-002');
  });
});

describe('WorkspaceConfig interface', () => {
  it('can create an object with all layout configuration fields', () => {
    const config: WorkspaceConfig = {
      columnCount: 3,
      columnWidthPx: 280,
      blockGapPx: 12,
      canvasPaddingPx: 20,
    };
    expect(config.columnCount).toBe(3);
    expect(config.columnWidthPx).toBe(280);
    expect(config.blockGapPx).toBe(12);
    expect(config.canvasPaddingPx).toBe(20);
  });
});

describe('Workspace interface', () => {
  it('can create an empty workspace', () => {
    const workspace: Workspace = {
      columns: [],
      config: {
        columnCount: 3,
        columnWidthPx: 280,
        blockGapPx: 12,
        canvasPaddingPx: 20,
      },
    };
    expect(workspace.columns).toEqual([]);
    expect(workspace.config.columnCount).toBe(3);
  });

  it('can create a workspace with columns and blocks', () => {
    const workspace: Workspace = {
      columns: [
        {
          index: 0,
          blocks: [
            {
              id: 'inst-001',
              definitionId: 'filter',
              columnIndex: 0,
              orderIndex: 0,
              parameterValues: { field: 'status', value: 'active' },
            },
            {
              id: 'inst-002',
              definitionId: 'sort',
              columnIndex: 0,
              orderIndex: 1,
              parameterValues: { field: 'name' },
            },
          ],
        },
        {
          index: 1,
          blocks: [],
        },
        {
          index: 2,
          blocks: [
            {
              id: 'inst-003',
              definitionId: 'map',
              columnIndex: 2,
              orderIndex: 0,
              parameterValues: { expression: 'x * 2' },
            },
          ],
        },
      ],
      config: {
        columnCount: 3,
        columnWidthPx: 280,
        blockGapPx: 12,
        canvasPaddingPx: 20,
      },
    };
    expect(workspace.columns).toHaveLength(3);
    expect(workspace.columns[0].blocks).toHaveLength(2);
    expect(workspace.columns[1].blocks).toHaveLength(0);
    expect(workspace.columns[2].blocks).toHaveLength(1);
    expect(workspace.config.columnCount).toBe(3);
  });
});
