export enum ParameterType {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  SELECT = 'SELECT',
  COLOR = 'COLOR',
}

export interface SelectOption {
  label: string;
  value: string;
}

export interface ValidationRule {
  min?: number;
  max?: number;
  step?: number;
  pattern?: string;
  required: boolean;
}

export interface ParameterDefinition {
  id: string;
  name: string;
  type: ParameterType;
  defaultValue: unknown;
  options?: SelectOption[];
  validation?: ValidationRule;
}

export interface BlockDefinition {
  id: string;
  name: string;
  category: string;
  description: string;
  color: string;
  inputType?: string;
  outputType?: string;
  parameters: ParameterDefinition[];
}

export interface BlockDefinitionConfig {
  blocks: BlockDefinition[];
}