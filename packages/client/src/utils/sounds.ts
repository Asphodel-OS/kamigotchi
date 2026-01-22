import { InteractionFX } from 'assets/sound/fx/interaction';

const fxBell = new Audio(InteractionFX.bell);
const fxClick = new Audio(InteractionFX.click2);
const fxCrafting = new Audio(InteractionFX.crafting);
const fxError = new Audio(InteractionFX.error);
const fxFund = new Audio(InteractionFX.fund);
const fxLevelup = new Audio(InteractionFX.levelup);
const fxLiquidate = new Audio(InteractionFX.liquidate);
const fxMessage = new Audio(InteractionFX.message);
const fxQuestaccept = new Audio(InteractionFX.questaccept);
const fxQuestcomplete = new Audio(InteractionFX.questcomplete);
const fxRevive = new Audio(InteractionFX.revive);
const fxScavenge = new Audio(InteractionFX.scavenge);
const fxScribble = new Audio(InteractionFX.scribble);
const fxSignup = new Audio(InteractionFX.signup);
const fxSuccess = new Audio(InteractionFX.success);
const fxVend = new Audio(InteractionFX.vend);
const fxWonderegg = new Audio(InteractionFX.wonderegg);

export const playBell = () => playSound(fxBell);
export const playClick = () => playSound(fxClick);
export const playCrafting = () => playSound(fxCrafting);
export const playError = () => playSound(fxError);
export const playFund = () => playSound(fxFund);
export const playLevelup = () => playSound(fxLevelup);
export const playLiquidate = () => playSound(fxLiquidate);
export const playMessage = () => playSound(fxMessage);
export const playQuestaccept = () => playSound(fxQuestaccept);
export const playQuestcomplete = () => playSound(fxQuestcomplete);
export const playRevive = () => playSound(fxRevive);
export const playScavenge = () => playSound(fxScavenge);
export const playScribble = () => playSound(fxScribble);
export const playSignup = () => playSound(fxSignup);
export const playSuccess = () => playSound(fxSuccess);
export const playVend = () => playSound(fxVend);
export const playWonderegg = () => playSound(fxWonderegg);

const playSound = (sound: HTMLAudioElement) => {
  const settings = JSON.parse(localStorage.getItem('settings') || '{}');
  const volume = settings.volume?.fx ?? 0.5;
  sound.volume = 0.6 * volume;
  sound.currentTime = 0;
  sound.play();
};
