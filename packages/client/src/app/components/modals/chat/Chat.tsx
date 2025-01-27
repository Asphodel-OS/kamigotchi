import { CastWithInteractions } from '@neynar/nodejs-sdk/build/neynar-api/v2';
import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';

import { EntityID } from '@mud-classic/recs';
import { ModalHeader, ModalWrapper } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { useSelected, useVisibility } from 'app/stores';
import { ChatIcon } from 'assets/images/icons/menu';
import { Message as KamiMessage } from 'engine/types/kamiden/kamiden';
import { getAccountByID, getAccountFromEmbedded } from 'network/shapes/Account';
import { getRoomByIndex } from 'network/shapes/Room';
import { InputRow } from './InputRow';
import { Feed } from './feed/Feed';

// make sure to set your NEYNAR_API_KEY .env

export function registerChatModal() {
  registerUIComponent(
    'ChatModal',
    {
      colStart: 67,
      colEnd: 100,
      rowStart: 8,
      rowEnd: 75,
    },

    // Requirement
    (layers) => {
      const { network } = layers;
      return interval(3333).pipe(
        map(() => {
          const account = getAccountFromEmbedded(network, { friends: true });
          const { world, components } = network;

          const { nodeIndex } = useSelected.getState();
          return {
            data: { account, world, components },
            utils: {
              getAccountByID: (accountid: EntityID) => getAccountByID(world, components, accountid),
              getRoomByIndex: (nodeIndex: number) => getRoomByIndex(world, components, nodeIndex),
            },
            network,
            nodeIndex,
            world,
          };
        })
      );
    },
    ({ data, network, nodeIndex, utils, world }) => {
      const { account } = data;
      const { actions, api } = network;
      const { modals } = useVisibility();
      const { getRoomByIndex } = utils;

      const [casts, setCasts] = useState<CastWithInteractions[]>([]);
      const [messages, setMessages] = useState<KamiMessage[]>([]);
      const maxCasts = 100;
      const [kamidenMessages, setKamidenMessages] = useState<KamiMessage[]>([]);
      const [scrollDown, setScrollDown] = useState(false);

      useEffect(() => {
        console.log('Chat visibility changed:', modals.chat);
        return () => {
          console.log('Cleaning up Kamiden connection - chat closed');
        };
      }, [modals.chat]);

      const pushCast = (cast: CastWithInteractions) => {};

      const pushCasts = (newCasts: CastWithInteractions[]) => {};

      const pushMessage = (newMessage: KamiMessage) => {};

      const pushMessages = (newMessages: KamiMessage[]) => {};

      return (
        <ModalWrapper
          id='chat'
          header={
            <ModalHeader title={`${getRoomByIndex(nodeIndex).name} ChatRoom`} icon={ChatIcon} />
          }
          footer={
            <InputRow
              account={account}
              actions={{ pushCast, setScrollDown }}
              actionSystem={actions}
              api={api}
              world={world}
            />
          }
          canExit
        >
          <Feed
            scrollDown={scrollDown}
            nodeIndex={nodeIndex}
            max={maxCasts}
            utils={utils}
            actions={{ pushMessages, setMessages, setScrollDown }}
          />
        </ModalWrapper>
      );
    }
  );
}
