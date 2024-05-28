import ReactDOM from 'react-dom/client';

import { Layers } from 'layers/network';
import 'layers/react/styles/font.css';
import { registerLoadingState, registerUIComponents } from './components';
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

  const root = ReactDOM.createRoot(rootElement);
  root.render(<Root setLayers={setLayers} mountReact={mountReact} />);
  registerLoadingState();
  registerUIComponents(); // possibly should run this on a delayed callback once fully booted
}
