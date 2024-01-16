import bubble from 'assets/sound/fx/bubble_success.mp3';
import click from 'assets/sound/fx/mouseclick.wav';
import scribble from 'assets/sound/fx/scribbling.mp3';
import vending from 'assets/sound/fx/vending_machine.mp3';
import { useSound } from 'layers/react/store/sound';

export const playClick = () => {
  const fx = new Audio(click);
  playSound(fx);
}

export const playScribble = () => {
  const fx = new Audio(scribble);
  playSound(fx);
}

export const playSuccess = () => {
  const fx = new Audio(bubble);
  playSound(fx);
}

export const playVending = () => {
  const fx = new Audio(vending);
  playSound(fx);
}

const playSound = (sound: HTMLAudioElement) => {
  sound.volume = .6 * useSound.getState().volumeFX;
  sound.play();
}