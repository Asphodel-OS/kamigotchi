import { playClick } from 'utils/sounds';

// copy a string to clipboard
export const copy = (str: string) => {
  playClick();
  navigator.clipboard.writeText(str);
};

// returns which mouse button was clicked
export const mouseBttnClicked = (e: MouseEvent): string => {
  switch (e.button) {
    case 0:
      return 'left';
    case 1:
      return 'middle';
    case 2:
      return 'right';
    case 3:
      return 'back';
    case 4:
      return 'forward';
    default:
      return 'unknown';
  }
};
