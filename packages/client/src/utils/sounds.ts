import { audioManager } from 'audio/AudioManager';

// Route existing helpers to AudioManager by key for zero refactor at call sites
export const playFund = () => playByKey('fx.fund');
export const playClick = () => playByKey('fx.click');
export const playScribble = () => playByKey('fx.scribble');
export const playSignup = () => playByKey('fx.signup');
export const playSuccess = () => playByKey('fx.success');
export const playVend = () => playByKey('fx.vend');
export const playMessage = () => playByKey('fx.message');

const playByKey = (key: string) => {
  audioManager.playByKey(key);
};
