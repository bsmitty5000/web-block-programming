export interface Position {
  x: number;
  y: number;
}

export interface DropTarget {
  columnIndex: number;
  orderIndex: number;
  indicatorY: number;
}

export interface DragState {
  source: 'palette' | 'canvas';
  definitionId: string;
  instanceId: string | null;
  originColumn: number | null;
  originOrder: number | null;
  mouseX: number;
  mouseY: number;
  currentDropTarget: DropTarget | null;
}