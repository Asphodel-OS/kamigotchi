export type AudioQuality = 'low' | 'high';

export const AUDIO_EXT = 'm4a';
export const AUDIO_LOW_SUFFIX = '_low';
export const AUDIO_QUALITY_DEFAULT: AudioQuality = 'low';

const CDN_BASE_URL = import.meta.env.VITE_CDN_BASE_URL || 'https://cdn.prod.kamigotchi.io';

export const cdnAudio = (path: string, ext: string = AUDIO_EXT): string => {
  // path should be like "sound/fx/interaction/click" or "sound/ost/cave"
  return `${CDN_BASE_URL}/${path}.${ext}`;
};

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
