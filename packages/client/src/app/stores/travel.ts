import { create } from 'zustand';
import type { Account } from 'network/shapes/Account';

interface TravelState {
  account: Account | null;
  targetRoomIndex: number | null;
  setTravel: (data: Partial<Pick<TravelState, 'account' | 'targetRoomIndex'>>) => void;
  resetTravel: () => void;
}

export const useTravel = create<TravelState>((set) => ({
  account: null,
  targetRoomIndex: null,
  setTravel: (data) => set((state) => ({ ...state, ...data })),
  resetTravel: () => set({ account: null, targetRoomIndex: null }),
})); 