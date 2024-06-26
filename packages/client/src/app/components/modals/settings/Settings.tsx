import { of } from 'rxjs';
import styled from 'styled-components';

import { ModalHeader, ModalWrapper } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { settingsIcon } from 'assets/images/icons/menu';

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
          truncate
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
