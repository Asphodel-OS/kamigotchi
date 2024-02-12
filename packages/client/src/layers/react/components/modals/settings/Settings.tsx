import React from 'react';
import { of } from 'rxjs';
import styled from 'styled-components';

import { Account } from './Account';
import { Volume } from './Volume';
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
      return (
        <ModalWrapper
          divName='settings'
          id='settings_modal'
          header={<ModalHeader title='Settings' icon={settingsIcon} />}
          canExit
        >
          <Volume />
          <Divider />
          <Account />
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
