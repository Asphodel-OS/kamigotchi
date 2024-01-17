import { InteractionFX } from 'assets/sound/fx/interaction';
import { useSound } from 'layers/react/store/sound';

export const playClick = () => {
  const fx = new Audio(InteractionFX.click);
  playSound(fx);
}

export const playScribble = () => {
  const fx = new Audio(InteractionFX.scribble);
  playSound(fx);
}

export const playSuccess = () => {
  const fx = new Audio(InteractionFX.success);
  playSound(fx);
}

export const playVending = () => {
  const fx = new Audio(InteractionFX.vend);
  playSound(fx);
}

const playSound = (sound: HTMLAudioElement) => {
  sound.volume = .6 * useSound.getState().volumeFX;
  sound.play();
}