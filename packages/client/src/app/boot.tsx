import ReactDOM from 'react-dom/client';

import 'app/styles/font.css';
import { Layers } from 'network/';
import { Root } from './root/Root';

export const mountReact: { current: (mount: boolean) => void } = {
  current: () => void 0,
};

// Q: what does this even do?
export const setLayers: { current: (layers: Layers) => void } = {
  current: () => void 0,
};

export function boot() {
  const rootElement = document.getElementById('react-root');
  if (!rootElement) return console.warn('React root not found');

  // wagmi mounts with the boot screen now, so a stale store must be gone before its first read
  localStorage.removeItem('wagmi.store');
  const root = ReactDOM.createRoot(rootElement);
  root.render(<Root setLayers={setLayers} mountReact={mountReact} />);
}
