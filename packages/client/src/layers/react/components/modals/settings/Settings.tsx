import { of } from 'rxjs';
import styled from 'styled-components';

import { settingsIcon } from 'assets/images/icons/menu';
import { ModalHeader, ModalWrapper } from 'layers/react/components/library';
import { registerUIComponent } from 'layers/react/root';

import { Account } from './Account';
import { Volume } from './Volume';

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
          id='settings'
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
