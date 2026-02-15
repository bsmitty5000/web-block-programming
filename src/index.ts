import './styles/index.css';
import { App } from './components/App';
import { BlockDefinitionConfig } from './types/blocks';
import { SerializationService } from './services/SerializationService';
import { BlockRegistry } from './services/BlockRegistry';
import { HostBridge } from './services/host/HostBridge';
import { WebHostBridge } from './services/host/WebHostBridge';
import { VSCodeHostBridge } from './services/host/VSCodeHostBridge';
import blocksData from './config/blocks.json';

const sampleBlocks = blocksData as BlockDefinitionConfig;

export function init(container: HTMLElement, registry: BlockRegistry): App {
  return new App(container, registry);
}

function createHostBridge(serializer: SerializationService, registry: BlockRegistry): HostBridge {
  if (typeof acquireVsCodeApi === 'function') {
    return new VSCodeHostBridge(serializer, registry);
  }
  return new WebHostBridge(serializer, registry);
}

const appEl = document.getElementById('app');
if (appEl) {
  const registry = new BlockRegistry();
  registry.loadFromConfig(sampleBlocks);

  init(appEl, registry);
  createHostBridge(new SerializationService(), registry);
}
