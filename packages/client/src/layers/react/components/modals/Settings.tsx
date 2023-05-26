import React, { useState, useEffect, useCallback } from 'react';
import { map, merge } from 'rxjs';
import styled from 'styled-components';
import { EntityIndex, Has, HasValue, getComponentValue, runQuery } from '@latticexyz/recs';
import * as mqtt from 'mqtt';

import mutedSoundImage from '../../../../assets/images/sound_muted_native.png';
import soundImage from '../../../../assets/images/sound_native.png';
import { dataStore } from 'layers/react/store/createStore';

import { ModalWrapperFull } from 'layers/react/components/library/ModalWrapper';
import { registerUIComponent } from 'layers/react/engine/store';
import 'layers/react/styles/font.css';

export function registerSettingsModal() {
  registerUIComponent(
    'Settings',
    {
      colStart: 69,
      colEnd: 100,
      rowStart: 10,
      rowEnd: 62,
    },

    (layers) => {
      const {
        network: {
          components: { IsAccount, Name },
        },
      } = layers;

      return merge(IsAccount.update$, Name.update$).pipe(
        map(() => {
          return {
            chatName: 'hi',
          };
        })
      );
    },

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
        <ModalWrapperFull divName='settings' id='settings_modal'>
          <div
            style={{ pointerEvents: 'auto' }}
            onPointerOut={() => {
              handleVolumeSliderVisibility(false);
            }}
            onPointerOver={() => {
              handleVolumeSliderVisibility(true);
            }}
          >
            <div style={{ display: 'grid', height: '100%', pointerEvents: 'auto' }}>
              <Header style={{ gridRow: 1, gridColumn: 1 }}>Settings</Header>
              <Divider style={{ gridRow: 2, gridColumn: 1 }} />
              <SubHeader style={{ gridRow: 3, gridColumn: 1 }}>Sound</SubHeader>
              <div style={{ gridColumn: 1, gridRow: 5 }}>
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
                style={{ pointerEvents: 'auto', gridColumn: 1, gridRow: 4 }}
              >
                <img src={!muted ? soundImage : mutedSoundImage} alt='sound_icon' />
              </div>
              <Divider style={{ gridRow: 7, gridColumn: 1 }} />
              <Text style={{ gridRow: 8, gridColumn: 1 }}>
                {' '}
                Currently there are no other settings. Suggestions appreciated.{' '}
              </Text>
            </div>
          </div>
        </ModalWrapperFull>
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

const Header = styled.p`
  font-size: 24px;
  color: #333;
  text-align: left;
  padding: 2px;
  font-family: Pixel;
`;

const SubHeader = styled.p`
  font-size: 18px;
  color: #333;
  text-align: left;
  padding: 2px;
  font-family: Pixel;
`;

const Text = styled.p`
  font-size: 12px;
  color: #333;
  text-align: left;
  padding: 2px;
  font-family: Pixel;
`;

const Divider = styled.hr`
  color: #333;
`;
