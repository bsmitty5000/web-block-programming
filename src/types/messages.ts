export type WebviewMessage =
  | { type: 'save'; payload: string }
  | { type: 'ready' }
  | { type: 'dirty'; payload: boolean };

export type HostMessage =
  | { type: 'load'; payload: string }
  | { type: 'config'; payload: object };