import { playClick } from 'utils/sounds';

// copy a string to clipboard
export const copy = (str: string) => {
  playClick();
  navigator.clipboard.writeText(str);
};
