import { Workspace } from '../../types/workspace';

export interface HostBridge {
    /** Send the current workspace state to the host for persistence. */
    sendState(workspace: Workspace): void;

    /** Register a callback to be called when the host provides saved state to load. */
    onLoadState(callback: (workspace: Workspace) => void): void;

    /** Request the host to persist the current state. */
    requestSave(): void;

    /** Request the host to load saved state. */
    requestLoad(): void;
}