import React, { useState, useEffect } from 'react';
import { of } from 'rxjs';
import styled from 'styled-components';

import { ModalWrapperFull } from 'layers/react/components/library/ModalWrapper';
import { registerUIComponent } from 'layers/react/engine/store';

import 'layers/react/styles/font.css';
import { Sound } from './Sound';
import { Account } from './Account';

export function registerSettingsModal() {
  registerUIComponent(
    'Settings',
    {
      colStart: 67,
      colEnd: 100,
      rowStart: 10,
      rowEnd: 75,
    },

    (layers) => of(layers),
    () => {
      const [status, setStatus] = useState('');

      // remove status text after N seconds
      useEffect(() => {
        setTimeout(() => setStatus(''), 2000);
      }, [status]);


      ///////////////////
      // DISPLAY

      return (
        <ModalWrapperFull
          divName='settings'
          id='settings_modal'
          header={<Header>Settings</Header>}
          canExit
        >
          <Sound />
          <Divider />
          <Account setStatus={setStatus} />
          <StatusText>{status}</StatusText>
        </ModalWrapperFull>
      );
    }
  );
}


const Header = styled.div`
  font-size: 1.5vw;
  color: #333;
  text-align: left;
  padding: 1.2vw 1.8vw;
  font-family: Pixel;
`;

const Divider = styled.hr`
  color: #333;
  width: 90%;
  align-self: center;
`;

const StatusText = styled.div`
  color: #FF785B;
  
  position: absolute;
  bottom: 1vw;
  width: 100%;
  text-align: center;

  font-family: Pixel;
  font-size: .4vw;

  cursor: pointer;
`;