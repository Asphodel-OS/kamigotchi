import { useContext } from 'react';
import { RootContext } from '../context';

export function useStore() {
  return useContext(RootContext);
}
