import { BlockDefinition, BlockDefinitionConfig } from "../types/blocks";

export class BlockRegistry 
{
  private definitions: Map<string, BlockDefinition>;
  private categories: Map<string, BlockDefinition[]>;

  constructor() 
  {
    this.definitions = new Map();
    this.categories = new Map();
  }
  
  register(definition: BlockDefinition): void
  {
    if(this.definitions.has(definition.id))
    {
      throw new Error(`Block definition with ID "${definition.id}" already exists.`);
    }
  
    this.definitions.set(definition.id, definition);

    const existing = this.categories.get(definition.category);
    if(existing)
    {
      existing.push(definition);
    }
    else
    {
      this.categories.set(definition.category, [definition]);
    }
  }

  get(id: string): BlockDefinition
  {
    const retVal = this.definitions.get(id);
    if(retVal == undefined)
    {
      throw new Error(`No block definition with "${id}" found in registry.`);
    }

    return retVal;
  }

  getByCategory(category: string): BlockDefinition[]
  {
    const blocks = this.categories.get(category);
    if(blocks)
    {
      return [...blocks];
    }
    else
    {
      return [];
    }
  }

  getCategories(): string[]
  {
    return Array.from(this.categories.keys()).sort();
  }

  getAll(): BlockDefinition[]
  {
    return Array.from(this.definitions.values());
  }

  loadFromConfig(config: BlockDefinitionConfig): void
  {
    config.blocks.forEach((block, _) =>
    {
      this.register(block);
    });
  }
}