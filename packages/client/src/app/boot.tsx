import ReactDOM from 'react-dom/client';

import { initMediaQueryListeners } from 'app/root/hooks/useMediaQuery';
import 'app/styles/font.css';
import 'app/styles/GlobalStyle.css';
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

  //initialise media query listeners
  initMediaQueryListeners();

  const root = ReactDOM.createRoot(rootElement);
  root.render(<Root setLayers={setLayers} mountReact={mountReact} />);
}
