import { create } from 'zustand';
import type { Modals } from './visibility';

export type DevControlsTarget = keyof Modals | 'global';

interface DevEvent {
  target: DevControlsTarget;
  type: string;
  payload?: any;
  token: number;
}

interface DevControlsState {
  lastEvent?: DevEvent;
  _token: number;
  send: (target: DevControlsTarget, type: string, payload?: any) => void;
}

export const useDevControls = create<DevControlsState>((set) => ({
  lastEvent: undefined,
  _token: 0,
  send: (target: DevControlsTarget, type: string, payload?: any) => {
    try {
      set((prev) => {
        const nextToken = prev._token + 1;
        return { lastEvent: { target, type, payload, token: nextToken }, _token: nextToken };
      });
    } catch (e) {
      // swallow errors to avoid crashing the app in dev mode
      console.warn('[DevControls] send failed', e);
    }
  },
}));


