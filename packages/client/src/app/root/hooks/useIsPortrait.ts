import { useEffect, useState } from 'react';
import { Modals } from 'app/stores';

export const LEFT_COLUMN_MODALS: (keyof Modals)[] = [
  'map', 'merchant', 'trading', 'account', 'party'
];

export const RIGHT_COLUMN_MODALS: (keyof Modals)[] = [
  'chat', 'help', 'inventory', 'quests', 'questDialogue', 'settings', 'kami',
  'crafting', 'node', 'tokenPortal', 'emaBoard', 'operatorFund', 'gacha',
  'goal', 'leaderboard', 'reveal', 'lootBox', 'animationStudio',
  'bridgeERC20', 'bridgeERC721', 'presale', 'templeOfTheWheel'
];

export const getPortraitCollidingModals = (targetModal: keyof Modals): Partial<Modals> => {
  if (LEFT_COLUMN_MODALS.includes(targetModal)) {
    return Object.fromEntries(
      LEFT_COLUMN_MODALS.filter(m => m !== targetModal).map(m => [m, false])
    ) as Partial<Modals>;
  }
  if (RIGHT_COLUMN_MODALS.includes(targetModal)) {
    return Object.fromEntries(
      RIGHT_COLUMN_MODALS.filter(m => m !== targetModal).map(m => [m, false])
    ) as Partial<Modals>;
  }
  return {};
};

export const useIsPortrait = () => {
  const [isPortrait, setIsPortrait] = useState(
    () => window.matchMedia('(orientation: portrait)').matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(orientation: portrait)');
    const handler = (e: MediaQueryListEvent) => setIsPortrait(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return isPortrait;
};
