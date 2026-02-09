export interface BlockInstance {
  id: string;
  definitionId: string;
  columnIndex: number;
  orderIndex: number;
  parameterValues: Record<string, unknown>;
}

export interface Column {
  index: number;
  blocks: BlockInstance[];
}

export interface WorkspaceConfig {
  columnCount: number;
  columnWidthPx: number;
  blockGapPx: number;
  canvasPaddingPx: number;
}

export interface Workspace {
  columns: Column[];
  config: WorkspaceConfig;
}