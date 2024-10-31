import { interval, map } from 'rxjs';
import styled from 'styled-components';

import { ModalHeader, ModalWrapper } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { settingsIcon } from 'assets/images/icons/menu';

import { getAccountFromBurner } from 'network/shapes/Account';
import { Account } from './Account';
import { Debugging } from './Debugging';
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

    (layers) =>
      interval(5000).pipe(
        map(() => {
          const { network } = layers;
          const account = getAccountFromBurner(network);

          return {
            network: network,
            account: account,
          };
        })
      ),
    ({ network, account }) => {
      const { actions, api } = network;

      /////////////////
      // ACTIONS

      const echoRoom = () => {
        actions.add({
          action: 'Sync location',
          params: [],
          description: 'Syncing account location',
          execute: async () => {
            return api.player.echo.room();
          },
        });
      };

      const echoKamis = () => {
        actions.add({
          action: 'Sync kamis',
          params: [],
          description: 'Syncing account kamis',
          execute: async () => {
            return api.player.echo.kami();
          },
        });
      };

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
          <Divider />
          <Debugging actions={{ echoRoom, echoKamis }} />
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
