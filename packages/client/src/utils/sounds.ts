import { audioManager } from 'audio/AudioManager';

// Route existing helpers to AudioManager by key for zero refactor at call sites
const playByKey = (key: string) => {
  audioManager.playByKey(key);
};

export const playBell = () => playByKey('fx.bell');
export const playClick = () => playByKey('fx.click');
export const playCrafting = () => playByKey('fx.crafting');
export const playError = () => playByKey('fx.error');
export const playFund = () => playByKey('fx.fund');
export const playLevelup = () => playByKey('fx.levelup');
export const playLiquidate = () => playByKey('fx.liquidate');
export const playMessage = () => playByKey('fx.message');
export const playQuestaccept = () => playByKey('fx.questaccept');
export const playQuestcomplete = () => playByKey('fx.questcomplete');
export const playRevive = () => playByKey('fx.revive');
export const playSacrifice = () => playByKey('fx.sacrifice');
export const playScavenge = () => playByKey('fx.scavenge');
export const playScribble = () => playByKey('fx.scribble');
export const playSignup = () => playByKey('fx.signup');
export const playSuccess = () => playByKey('fx.success');
export const playVend = () => playByKey('fx.vend');
export const playWonderegg = () => playByKey('fx.wonderegg');
