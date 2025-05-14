import { InteractionFX } from 'assets/sound/fx/interaction';

const fxClick = new Audio(InteractionFX.click);
const fxFund = new Audio(InteractionFX.fund);
const fxScribble = new Audio(InteractionFX.scribble);
const fxSignup = new Audio(InteractionFX.signup);
const fxSuccess = new Audio(InteractionFX.success);
const fxVend = new Audio(InteractionFX.vend);
const fxMessage = new Audio(InteractionFX.message);

export const playFund = () => playSound(fxFund);
export const playClick = () => playSound(fxClick);
export const playScribble = () => playSound(fxScribble);
export const playSignup = () => playSound(fxSignup);
export const playSuccess = () => playSound(fxSuccess);
export const playVend = () => playSound(fxVend);
export const playMessage = () => playSound(fxMessage);

const playSound = (sound: HTMLAudioElement) => {
  const settings = JSON.parse(localStorage.getItem('settings') || '{}');
  const volume = settings.volume?.fx ?? 0.5;
  sound.volume = 0.6 * volume;
  sound.currentTime = 0;
  sound.play();
};
