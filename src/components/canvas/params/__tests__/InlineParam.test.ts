import { describe, it, expect, vi } from 'vitest';
import { InlineParam } from '../InlineParam';
import { ParameterDefinition, ParameterType } from '../../../../types/blocks';

function makeParam(overrides: Partial<ParameterDefinition> & { type: ParameterType }): ParameterDefinition {
  return {
    id: 'test-param',
    name: 'Test',
    defaultValue: '',
    ...overrides,
  };
}

describe('InlineParam', () => {
  it('creates an input[type=text] for TEXT parameters', () => {
    const param = makeParam({ type: ParameterType.TEXT });
    const el = InlineParam.create(param, 'hello', vi.fn());
    expect(el.querySelector('input[type="text"]')).not.toBeNull();
  });

  it('creates an input[type=number] for NUMBER parameters', () => {
    const param = makeParam({ type: ParameterType.NUMBER, defaultValue: 0 });
    const el = InlineParam.create(param, 42, vi.fn());
    expect(el.querySelector('input[type="number"]')).not.toBeNull();
  });

  it('creates an input[type=checkbox] for BOOLEAN parameters', () => {
    const param = makeParam({ type: ParameterType.BOOLEAN, defaultValue: false });
    const el = InlineParam.create(param, false, vi.fn());
    expect(el.querySelector('input[type="checkbox"]')).not.toBeNull();
  });

  it('creates a select for SELECT parameters', () => {
    const param = makeParam({
      type: ParameterType.SELECT,
      options: [{ label: 'A', value: 'a' }, { label: 'B', value: 'b' }],
    });
    const el = InlineParam.create(param, 'a', vi.fn());
    expect(el.querySelector('select')).not.toBeNull();
  });

  it('creates an input[type=color] for COLOR parameters', () => {
    const param = makeParam({ type: ParameterType.COLOR, defaultValue: '#000000' });
    const el = InlineParam.create(param, '#ff0000', vi.fn());
    expect(el.querySelector('input[type="color"]')).not.toBeNull();
  });
});
