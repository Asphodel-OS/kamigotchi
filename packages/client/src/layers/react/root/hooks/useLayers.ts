import { useContext } from 'react';
import { NetworkContext } from '../context';

export function useLayers() {
  return useContext(NetworkContext);
}
