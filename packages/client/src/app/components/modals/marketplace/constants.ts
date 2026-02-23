export const DEFAULT_SELECTED_FILTERS = () => ({
  Face: new Set<string>(),
  Hands: new Set<string>(),
  'Body Type': new Set<string>(),
  'Body Color': new Set<string>(),
  Background: new Set<string>(),
});

export const DEFAULT_STAT_FILTERS = () => ({
  Health: 10,
  Power: 10,
  Violence: 10,
  Harmony: 10,
  Slots: 0,
});
