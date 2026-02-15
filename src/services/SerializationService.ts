import { Column, Workspace, WorkspaceConfig } from '../types/workspace';
import { BlockRegistry } from './BlockRegistry';

export interface ValidationResult {
    valid: boolean;
    errors: string[];
}

export class SerializationService {
    /**
     * Converts the workspace to a JSON string. The output format:
     * ```json
     * {
     *   "version": 1,
     *   "config": { "columnCount": 3, "columnWidthPx": 280, ... },
     *   "columns": [
     *     [
     *       { "id": "block-1", "definitionId": "filter", "parameterValues": { ... } },
     *       ...
     *     ],
     *     ...
     *   ]
     * }
     * ```
     * Note: `columnIndex` and `orderIndex` are omitted — they're derived from array position.
     */
    serialize(workspace: Workspace): string
    {
        const columns = workspace.columns.map(column =>
            column.blocks.map(block => ({
                id: block.id,
                definitionId: block.definitionId,
                parameterValues: block.parameterValues
            }))
        );

        return JSON.stringify({
            version: 1,
            config:
            {
                columnCount: workspace.config.columnCount,
                columnWidthPx: workspace.config.columnWidthPx,
                blockGapPx: workspace.config.blockGapPx,
                canvasPaddingPx: workspace.config.canvasPaddingPx
            },
            columns
        });
    }

    /**
     * Parses the JSON string and reconstructs a `Workspace` object.
     * 1. Parses JSON and reads `version` field (currently expects 1).
     * 2. Reconstructs `WorkspaceConfig` from the `config` object.
     * 3. For each column array, creates `Column` objects with `BlockInstance` entries,
     *    setting `columnIndex` and `orderIndex` from the array positions.
     * 4. Validates that each block's `definitionId` exists in the `registry` (throws if not found).
     * 5. Returns the reconstructed `Workspace`.
     */
    deserialize(json: string, registry: BlockRegistry): Workspace
    {
        const data = JSON.parse(json);

        if (data.version !== 1)
        {
            throw new Error(`Unsupported version: ${data.version}`);
        }

        const config: WorkspaceConfig = {
            columnCount: data.config.columnCount,
            columnWidthPx: data.config.columnWidthPx,
            blockGapPx: data.config.blockGapPx,
            canvasPaddingPx: data.config.canvasPaddingPx
        };

        const columns: Column[] = (data.columns as unknown[][]).map(
            (blockArray, columnIndex) => ({
                index: columnIndex,
                blocks: (blockArray as { id: string; definitionId: string; parameterValues: Record<string, unknown> }[]).map(
                    (blockData, orderIndex) =>
                    {
                        registry.get(blockData.definitionId);

                        return {
                            id: blockData.id,
                            definitionId: blockData.definitionId,
                            columnIndex,
                            orderIndex,
                            parameterValues: blockData.parameterValues
                        };
                    }
                )
            })
        );

        return { columns, config };
    }

    /**
     * Lightweight validation without full deserialization. Checks:
     * - Valid JSON syntax
     * - Has `version` field (number)
     * - Has `config` object with required fields
     * - Has `columns` array
     * Returns `{ valid: true, errors: [] }` or `{ valid: false, errors: [...] }`.
     */
    validate(json: string): ValidationResult
    {
        const errors: string[] = [];

        let data: unknown;
        try
        {
            data = JSON.parse(json);
        }
        catch
        {
            return { valid: false, errors: ['Invalid JSON syntax'] };
        }

        if (typeof data !== 'object' || data === null || Array.isArray(data))
        {
            return { valid: false, errors: ['Root must be an object'] };
        }

        const obj = data as Record<string, unknown>;

        if (typeof obj.version !== 'number')
        {
            errors.push('Missing or invalid "version" field (expected number)');
        }

        if (typeof obj.config !== 'object' || obj.config === null || Array.isArray(obj.config))
        {
            errors.push('Missing or invalid "config" object');
        }
        else
        {
            const config = obj.config as Record<string, unknown>;
            for (const field of ['columnCount', 'columnWidthPx', 'blockGapPx', 'canvasPaddingPx'])
            {
                if (typeof config[field] !== 'number')
                {
                    errors.push(`Missing or invalid "config.${field}" (expected number)`);
                }
            }
        }

        if (!Array.isArray(obj.columns))
        {
            errors.push('Missing or invalid "columns" array');
        }

        return { valid: errors.length === 0, errors };
    }
}