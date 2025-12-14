export type AudioQuality = 'low' | 'high';

export const AUDIO_EXT = 'm4a';
export const AUDIO_LOW_SUFFIX = '_low';
export const AUDIO_QUALITY_DEFAULT: AudioQuality = 'low';

export const withAudioExt = (path: string): string => {
  if (!path) return path;
  const base = path.replace(/\.[^/.]+$/, '');
  return `${base}.${AUDIO_EXT}`;
};

export const withAudioQuality = (pathWithExt: string, quality: AudioQuality): string => {
  if (!pathWithExt) return pathWithExt;
  if (quality === 'high') return pathWithExt;
  return pathWithExt.replace(/\.[^/.]+$/, `${AUDIO_LOW_SUFFIX}.${AUDIO_EXT}`);
};
