import './styles/index.css';
import { App } from './components/App';

export function init(container: HTMLElement): App {
  return new App(container);
}

const appEl = document.getElementById('app');
if (appEl) {
  init(appEl);
}
