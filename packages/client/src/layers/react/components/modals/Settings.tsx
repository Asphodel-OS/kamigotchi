import React, { useState, useEffect, useCallback } from 'react';
import { map, merge } from 'rxjs';
import styled from 'styled-components';

import { ActionButton } from 'layers/react/components/library/ActionButton';
import { ModalWrapperFull } from 'layers/react/components/library/ModalWrapper';
import { Tooltip } from 'layers/react/components/library/Tooltip';
import { registerUIComponent } from 'layers/react/engine/store';
import { dataStore } from 'layers/react/store/createStore';
import { useKamiAccount } from 'layers/react/store/kamiAccount';

import mutedSoundImage from 'src/assets/images/icons/sound_muted_native.png';
import soundImage from 'src/assets/images/icons/sound_native.png';
import 'layers/react/styles/font.css';

export function registerSettingsModal() {
  registerUIComponent(
    'Settings',
    {
      colStart: 67,
      colEnd: 100,
      rowStart: 10,
      rowEnd: 50,
    },

    (layers) => {
      const {
        network: {
          components: {
            IsAccount,
            Name
          },
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

      const {
        sound: { volume }, setSoundState, visibleModals, setVisibleModals,
      } = dataStore();
      const { details: accountDetails } = useKamiAccount();
      const muted = volume == 0;

      const [statusText, setStatusText] = useState('');

      ///////////////////
      // INTERACTIONS

      const truncateAddress = (address: string) => {
        return address.slice(0, 6) + '...' + address.slice(-4);
      };

      const copyText = (text: string) => {
        navigator.clipboard.writeText(text);
        setStatusText('Copied to clipboard!');
      };

      const setVolumeRate = (e: any) => {
        const soundVolume = e.target.value as number;

        setSoundState({ volume: soundVolume });
      };

      const toggleSound = () => {
        muted ? setSoundState({ volume: 0.5 }) : setSoundState({ volume: 0 });
      };

      // remove status text after N seconds
      useEffect(() => {
        setTimeout(() => setStatusText(''), 2000);
      }, [statusText]);

      ///////////////////
      // DISPLAY

      // template for a single row with an action button
      const ButtonRow = (text: string, hoverText: string, buttonText: string, onClick: Function) => {
        return (
          <SingleRow>
            <Text>{text}</Text>
            <Tooltip text={[hoverText]}>
              <ActionButton
                id='settings_button'
                onClick={onClick}
                size='small'
                text={buttonText}
              />
            </Tooltip>
          </SingleRow>
        )
      };


      return (
        <ModalWrapperFull divName='settings' id='settings_modal'>
          <div style={{ display: 'flex', flexDirection: 'column', height: '95%', pointerEvents: 'auto' }}>
            <Header>Settings</Header>
            <Divider />
            <SubHeader>Sound</SubHeader>
            <SingleRow>
              <Text style={{ flexGrow: 2 }}>Volume</Text>
              <input
                type='range'
                min='0'
                max='1'
                step='0.1'
                value={volume}
                onChange={setVolumeRate}
                style={{ ...rangeInputStyle, display: 'block' }}
              />
              <div className='window' onClick={toggleSound} style={{ pointerEvents: 'auto', padding: '0px 6px' }}>
                <img src={!muted ? soundImage : mutedSoundImage} alt='sound_icon' />
              </div>
            </SingleRow>
            <Divider />
            <SubHeader>Account [{accountDetails.name}]</SubHeader>
            {ButtonRow(
              'Owner:',
              accountDetails.ownerAddress,
              truncateAddress(accountDetails.ownerAddress),
              () => copyText(accountDetails.ownerAddress)
            )}
            {ButtonRow(
              'Operator:',
              accountDetails.operatorAddress,
              truncateAddress(accountDetails.operatorAddress),
              () => copyText(accountDetails.operatorAddress)
            )}
            {ButtonRow(
              '',
              '',
              'Copy private key',
              () => copyText(localStorage.getItem("operatorPrivateKey") || '')
            )}
            {ButtonRow(
              '',
              '',
              'Update operator',
              () => setVisibleModals({ ...visibleModals, operatorUpdater: true })
            )}
            {ButtonRow(
              '',
              '',
              'Fund perator',
              () => setVisibleModals({ ...visibleModals, operatorFund: true })
            )}
          </div>
          <StatusText>{statusText}</StatusText>
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

const SingleRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const StatusText = styled.div`
  font-size: 12px;
  color: #FF785B;
  text-align: center;
  padding: 4px;
  font-family: Pixel;
  
  cursor: pointer;
  border-width: 0px;
  background-color: #ffffff;
`;