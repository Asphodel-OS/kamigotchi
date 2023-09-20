import create from 'zustand';

export interface SoundSettings {
  volumeFX: number;
  volumeMusic: number;
}

interface SoundActions {
  setVolumeFX: (volume: number) => void;
  setVolumeMusic: (volume: number) => void;
}

export const useSoundSettings = create<SoundSettings & SoundActions>((set) => {
  const initialState: SoundSettings = {
    volumeFX: 0.5,
    volumeMusic: 0.5,
  };
  return {
    ...initialState,
    setVolumeFX: (volume: number) => set(
      (state: SoundSettings) => ({ ...state, volumeFX: volume })
    ),
    setVolumeMusic: (volume: number) => set(
      (state: SoundSettings) => ({ ...state, volumeMusic: volume })
    ),
  };
});