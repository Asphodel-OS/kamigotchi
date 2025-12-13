export const AUDIO_EXT = 'm4a';

export const withAudioExt = (path: string): string => {
  if (!path) return path;
  const base = path.replace(/\.[^/.]+$/, '');
  return `${base}.${AUDIO_EXT}`;
};
