import { InteractionFX } from 'assets/sound/fx/interaction';

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
  const settings = JSON.parse(localStorage.getItem('settings') || '{}');
  const volume = settings.volume?.fx ?? 0.5;
  sound.volume = .6 * volume;
  sound.play();
}