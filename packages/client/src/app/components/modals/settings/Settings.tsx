import styled from 'styled-components';

import { ModalHeader, ModalWrapper } from 'app/components/library';
import { UIComponent } from 'app/root/types';
import { useLayers } from 'app/root/hooks';
import { SettingsIcon } from 'assets/images/icons/menu';
import { Account } from './Account';
import { Debugging } from './Debugging';
import { Volume } from './Volume';

export const SettingsModal: UIComponent = {
  id: 'SettingsModal',
  Render: () => {
    const layers = useLayers();
    
    const { network } = layers;
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
          return api.player.echo.kamis();
        },
      });
    };

    return (
      <ModalWrapper
        id='settings'
        header={<ModalHeader title='Settings' icon={SettingsIcon} />}
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
  },
};

const Divider = styled.hr`
  color: #333;
  width: 90%;
  align-self: center;
`;
