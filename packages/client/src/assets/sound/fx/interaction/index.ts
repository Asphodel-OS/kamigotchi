const CDN_BASE_URL = import.meta.env.VITE_CDN_BASE_URL || 'https://cdn.prod.kamigotchi.io';

const fx = (filename: string, ext: string = 'm4a') => `${CDN_BASE_URL}/sound/fx/interaction/${filename}.${ext}`;

export const click = fx('click');
export const dice = fx('dice');
export const echo = fx('echo');
export const fund = fx('fund');
export const message = fx('message');
export const phase = fx('phase');
export const scribble = fx('scribble');
export const signup = fx('signup');
export const success = fx('success');
export const teleport = fx('teleport');
export const trade = fx('trade');
export const vend = fx('vend');

export const InteractionFX = {
  click,
  dice,
  echo,
  fund,
  phase,
  scribble,
  signup,
  success,
  teleport,
  trade,
  vend,
  message,
};

export { fx };
