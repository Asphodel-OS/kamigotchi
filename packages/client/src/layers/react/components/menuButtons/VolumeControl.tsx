/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { registerUIComponent } from 'layers/react/engine/store';
import React, { useState } from 'react';
import { of } from 'rxjs';
import mutedSoundImage from '../../../../assets/images/sound_muted_native.png';
import soundImage from '../../../../assets/images/sound_native.png';
import { dataStore } from 'layers/react/store/createStore';

export function registerVolumeControl() {
  registerUIComponent(
    'VolumeControl',
    {
      colStart: 80,
      colEnd: 87,
      rowStart: 3,
      rowEnd: 12,
    },
    (layers) => of(layers),
    () => {
      const [volumeSliderVisibility, setvolumeSliderVisibility] = useState(false);

      const {
        sound: { volume },
        setSoundState,
      } = dataStore();
      const muted = volume == 0;

      const setVolumeRate = (e: any) => {
        const soundVolume = e.target.value as number;

        setSoundState({ volume: soundVolume });
      };

      const toggleSound = () => {
        muted ? setSoundState({ volume: 0.5 }) : setSoundState({ volume: 0 });
      };

      const handleVolumeSliderVisibility = (isVisible: boolean) => {
        setvolumeSliderVisibility(isVisible);
      };

      return (
        <div
          style={{ pointerEvents: 'auto'}}
          onPointerOut={() => {
            handleVolumeSliderVisibility(false);
          }}
          onPointerOver={() => {
            handleVolumeSliderVisibility(true);
          }}
        >
          <div style={{ display: 'grid', height: '100%', pointerEvents: 'auto' }}>
            <div
              style={{
                gridColumn: 1,
                gridRow: 2
              }}
            >
              <input
                type='range'
                min='0'
                max='1'
                step='0.1'
                value={volume}
                onChange={setVolumeRate}
                style={{ ...rangeInputStyle, display: volumeSliderVisibility ? 'block' : 'none' }}
              />
            </div>
            <div
              className='window'
              onClick={toggleSound}
              style={{ pointerEvents: 'auto', gridColumn: 1, gridRow: 1 }}
            >
              <img style={{height: '100%', width: 'auto' }}
                src={!muted ? soundImage : mutedSoundImage}
                alt='sound_icon'
              />
            </div>
          </div>
        </div>
      );
    }
  );
}

const rangeInputStyle = {
  width: '55px',
  height: '15px',
  borderRadius: '10px',
  background: '#d3d3d3',
  outline: 'none',
  opacity: 0.7,
  transition: 'opacity 0.2s',
};
