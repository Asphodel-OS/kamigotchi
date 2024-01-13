import React, { useState, useEffect } from 'react';
import { of } from 'rxjs';
import styled from 'styled-components';

import { Sound } from './Sound';
import { Account } from './Account';
import { settingsIcon } from 'assets/images/icons/menu';
import { ModalHeader } from 'layers/react/components/library/ModalHeader';
import { ModalWrapper } from 'layers/react/components/library/ModalWrapper';
import { registerUIComponent } from 'layers/react/engine/store';
import 'layers/react/styles/font.css';


export function registerSettingsModal() {
  registerUIComponent(
    'Settings',
    {
      colStart: 67,
      colEnd: 100,
      rowStart: 8,
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
        <ModalWrapper
          divName='settings'
          id='settings_modal'
          header={<ModalHeader title='Settings' icon={settingsIcon} />}
          canExit
        >
          <Sound />
          <Divider />
          <Account setStatus={setStatus} />
          <StatusText>{status}</StatusText>
        </ModalWrapper>
      );
    }
  );
}

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