const CDN_BASE_URL = import.meta.env.VITE_CDN_BASE_URL || 'https://cdn.prod.kamigotchi.io';

const fx = (filename: string, ext: string = 'mp3') => `${CDN_BASE_URL}/sound/fx/interaction/${filename}.${ext}`;

export const bell = fx('bell');
export const click = fx('click');
export const click2 = fx('click2');
export const crafting = fx('crafting');
export const dice = fx('dice');
export const echo = fx('echo');
export const error = fx('error');
export const fund = fx('fund');
export const levelup = fx('levelup');
export const liquidate = fx('liquidate');
export const message = fx('message');
export const phase = fx('phase');
export const questaccept = fx('questaccept');
export const questcomplete = fx('questcomplete');
export const revive = fx('revive');
export const sacrifice = fx('sacrifice');
export const scavenge = fx('scavenge');
export const scribble = fx('scribble');
export const signup = fx('signup');
export const success = fx('success');
export const teleport = fx('teleport');
export const trade = fx('trade', 'wav');
export const vend = fx('vend');
export const wonderegg = fx('wonderegg');

export const InteractionFX = {
  bell,
  click,
  click2,
  crafting,
  dice,
  echo,
  error,
  fund,
  levelup,
  liquidate,
  message,
  phase,
  questaccept,
  questcomplete,
  revive,
  sacrifice,
  scavenge,
  scribble,
  signup,
  success,
  teleport,
  trade,
  vend,
  wonderegg,
};

export { fx };
