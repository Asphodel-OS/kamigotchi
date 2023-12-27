import bubble from 'assets/sound/fx/bubble_success.mp3';
import click from 'assets/sound/fx/mouseclick.wav';
import scribble from 'assets/sound/fx/scribbling.mp3';
import vending from 'assets/sound/fx/vending_machine.mp3';
import { useSound } from 'layers/react/store/sound';

export const playClick = () => {
  const volume = useSound.getState().volumeFX;
  const clickFX = new Audio(click);
  clickFX.volume = volume;
  clickFX.play();
}

export const playScribble = () => {
  const volume = useSound.getState().volumeFX;
  const scribbleFX = new Audio(scribble);
  scribbleFX.volume = volume;
  scribbleFX.play();
}

export const playSuccess = () => {
  const volume = useSound.getState().volumeFX;
  const bubbleFX = new Audio(bubble);
  bubbleFX.volume = volume;
  bubbleFX.play();
}

export const playVending = () => {
  const volume = useSound.getState().volumeFX;
  const vendingFX = new Audio(vending);
  vendingFX.volume = volume;
  vendingFX.play();
}