import { useEffect } from 'react';
import { create } from 'zustand';

////////////////
// OVERVIEW

interface State {
  isMobile: boolean;
  isPortrait: boolean;
}

interface Actions {
  setIsMobile: (value: boolean) => void;
  setIsPortrait: (value: boolean) => void;
}

////////////////
// MEDIA QUERIES

const MOBILE_QUERY = '(max-aspect-ratio: 11/16)';
const PORTRAIT_QUERY = '(orientation: portrait)';

////////////////
// STORE

export const useMediaQueryStore = create<State & Actions>((set) => {
  const initialState: State = {
    isMobile: typeof window !== 'undefined' ? window.matchMedia(MOBILE_QUERY).matches : false,
    isPortrait: typeof window !== 'undefined' ? window.matchMedia(PORTRAIT_QUERY).matches : false,
  };

  return {
    ...initialState,
    setIsMobile: (value: boolean) => set({ isMobile: value }),
    setIsPortrait: (value: boolean) => set({ isPortrait: value }),
  };
});

////////////////
// INITIALIZATION

let listenersInitialized = false;

export const initMediaQueryListeners = () => {
  if (listenersInitialized || typeof window === 'undefined') return;
  listenersInitialized = true;

  const mobileQuery = window.matchMedia(MOBILE_QUERY);
  const portraitQuery = window.matchMedia(PORTRAIT_QUERY);

  mobileQuery.addEventListener('change', (e) => {
    useMediaQueryStore.getState().setIsMobile(e.matches);
  });

  portraitQuery.addEventListener('change', (e) => {
    useMediaQueryStore.getState().setIsPortrait(e.matches);
  });
};

////////////////
// HOOKS

export const useIsMobile = () => {
  const isMobile = useMediaQueryStore((s) => s.isMobile);
  useEffect(() => {
    initMediaQueryListeners();
  }, []);
  return isMobile;
};

export const useIsPortrait = () => {
  const isPortrait = useMediaQueryStore((s) => s.isPortrait);
  useEffect(() => {
    initMediaQueryListeners();
  }, []);
  return isPortrait;
};
