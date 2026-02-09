import { describe, it, expect } from 'vitest';
import {
  ParameterType,
  SelectOption,
  ValidationRule,
  ParameterDefinition,
  BlockDefinition,
  BlockDefinitionConfig,
} from '../blocks';

describe('ParameterType enum', () => {
  it('has all expected values', () => {
    expect(ParameterType.TEXT).toBe('TEXT');
    expect(ParameterType.NUMBER).toBe('NUMBER');
    expect(ParameterType.BOOLEAN).toBe('BOOLEAN');
    expect(ParameterType.SELECT).toBe('SELECT');
    expect(ParameterType.COLOR).toBe('COLOR');
  });
});

describe('SelectOption interface', () => {
  it('can create an object with required fields', () => {
    const option: SelectOption = {
      label: 'Option 1',
      value: 'option1',
    };
    expect(option.label).toBe('Option 1');
    expect(option.value).toBe('option1');
  });
});

describe('ValidationRule interface', () => {
  it('can create an object with required field and optional fields', () => {
    const rule: ValidationRule = {
      required: true,
    };
    expect(rule.required).toBe(true);
    expect(rule.min).toBeUndefined();
  });

  it('can create an object with all fields', () => {
    const rule: ValidationRule = {
      min: 0,
      max: 100,
      step: 5,
      pattern: '^[a-z]+$',
      required: true,
    };
    expect(rule.min).toBe(0);
    expect(rule.max).toBe(100);
    expect(rule.step).toBe(5);
    expect(rule.pattern).toBe('^[a-z]+$');
    expect(rule.required).toBe(true);
  });
});

describe('ParameterDefinition interface', () => {
  it('can create an object with required fields', () => {
    const param: ParameterDefinition = {
      id: 'field1',
      name: 'Field Name',
      type: ParameterType.TEXT,
      defaultValue: '',
    };
    expect(param.id).toBe('field1');
    expect(param.name).toBe('Field Name');
    expect(param.type).toBe(ParameterType.TEXT);
    expect(param.defaultValue).toBe('');
  });

  it('can create an object with optional fields', () => {
    const param: ParameterDefinition = {
      id: 'operator',
      name: 'Operator',
      type: ParameterType.SELECT,
      defaultValue: 'equals',
      options: [
        { label: 'Equals', value: 'equals' },
        { label: 'Not Equals', value: 'not_equals' },
      ],
    };
    expect(param.options).toHaveLength(2);
    expect(param.options?.[0].label).toBe('Equals');
  });

  it('can create an object with validation rule', () => {
    const param: ParameterDefinition = {
      id: 'count',
      name: 'Count',
      type: ParameterType.NUMBER,
      defaultValue: 1,
      validation: {
        min: 1,
        max: 100,
        required: true,
      },
    };
    expect(param.validation?.min).toBe(1);
    expect(param.validation?.max).toBe(100);
  });
});

describe('BlockDefinition interface', () => {
  it('can create an object with required fields', () => {
    const block: BlockDefinition = {
      id: 'filter',
      name: 'Filter',
      category: 'Transform',
      description: 'Filters items based on a condition',
      color: '#4A90D9',
      parameters: [],
    };
    expect(block.id).toBe('filter');
    expect(block.name).toBe('Filter');
    expect(block.category).toBe('Transform');
    expect(block.description).toBe('Filters items based on a condition');
    expect(block.color).toBe('#4A90D9');
    expect(block.parameters).toEqual([]);
  });

  it('can create an object with optional input/output types', () => {
    const block: BlockDefinition = {
      id: 'map',
      name: 'Map',
      category: 'Transform',
      description: 'Maps items',
      color: '#50E3C2',
      inputType: 'collection',
      outputType: 'collection',
      parameters: [],
    };
    expect(block.inputType).toBe('collection');
    expect(block.outputType).toBe('collection');
  });

  it('can create an object with multiple parameters', () => {
    const block: BlockDefinition = {
      id: 'filter',
      name: 'Filter',
      category: 'Transform',
      description: 'Filters items',
      color: '#4A90D9',
      parameters: [
        {
          id: 'field',
          name: 'Field',
          type: ParameterType.TEXT,
          defaultValue: '',
        },
        {
          id: 'operator',
          name: 'Operator',
          type: ParameterType.SELECT,
          defaultValue: 'equals',
          options: [{ label: 'Equals', value: 'equals' }],
        },
      ],
    };
    expect(block.parameters).toHaveLength(2);
    expect(block.parameters[0].id).toBe('field');
    expect(block.parameters[1].id).toBe('operator');
  });
});

describe('BlockDefinitionConfig interface', () => {
  it('can create an object with multiple block definitions', () => {
    const config: BlockDefinitionConfig = {
      blocks: [
        {
          id: 'filter',
          name: 'Filter',
          category: 'Transform',
          description: 'Filters items',
          color: '#4A90D9',
          parameters: [],
        },
        {
          id: 'map',
          name: 'Map',
          category: 'Transform',
          description: 'Maps items',
          color: '#50E3C2',
          parameters: [],
        },
      ],
    };
    expect(config.blocks).toHaveLength(2);
    expect(config.blocks[0].id).toBe('filter');
    expect(config.blocks[1].id).toBe('map');
  });
});
