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
            },
            network,
            nodeIndex,
          };
        })
      );
    },
    ({ data, network, nodeIndex, utils }) => {
      const { account } = data;
      const { actions, api } = network;
      const { modals } = useVisibility();

      const [casts, setCasts] = useState<CastWithInteractions[]>([]);
      const [messages, setMessages] = useState<KamiMessage[]>([]);
      const maxCasts = 100;
      const [kamidenMessages, setKamidenMessages] = useState<KamiMessage[]>([]);

      useEffect(() => {
        console.log('Chat visibility changed:', modals.chat);
        /*
        if (!modals.chat) return;

        // Initialize Kamiden client and fetch initial messages
        const initKamiden = async () => {
          try {
            console.log('Initializing Kamiden client');
            const client = getKamidenClient();

            // Get initial messages for room 0
            console.log(`Fetching room messages from room lab entrance roomIndex 6`); // ${account.roomIndex}...`);

            try {
              const response = await client.getRoomMessages({ RoomIndex: 6 });
              console.log('Messages', response.Messages);
              setKamidenMessages(response.Messages);
            } catch (e) {
              console.log('Error fetching initial messages:', e);
            }
          } catch (error) {
            console.error('Error connecting to Kamiden:', error);
          }
        };

        initKamiden();
        */
        return () => {
          console.log('Cleaning up Kamiden connection - chat closed');
        };
      }, [modals.chat]);

      const pushCast = (cast: CastWithInteractions) => {
        //setCasts([cast, ...casts]);
      };

      const pushCasts = (newCasts: CastWithInteractions[]) => {
        /*const oldCasts = [...casts];

        // split the new casts into unique and duplicates
        const uniqueCasts = [];
        for (const [_, newCast] of newCasts.entries()) {
          const collisionIndex = oldCasts.findIndex((c) => c.hash === newCast.hash);
          if (collisionIndex != -1) oldCasts[collisionIndex] = newCast;
          else uniqueCasts.push(newCast);
        }

        // sort the full set of casts by timestamp
        const allCasts = [...uniqueCasts, ...oldCasts];
        allCasts.sort((a, b) => moment(b.timestamp).diff(moment(a.timestamp)));
        setCasts(allCasts);
        */
      };

      const pushMessage = (newMessage: KamiMessage) => {
        //setMessages([newMessage, ...messages]);
      };

      const pushMessages = (newMessages: KamiMessage[]) => {
        //setKamidenMessages()
      };

      return (
        <ModalWrapper
          id='chat'
          header={<ModalHeader title='Chatxd' icon={ChatIcon} />}
          footer={
            <InputRow account={account} actions={{ pushCast }} actionSystem={actions} api={api} />
          }
          canExit
        >
          <Feed
            nodeIndex={nodeIndex}
            max={maxCasts}
            utils={utils}
            actions={{ pushMessages, setMessages }}
          />
        </ModalWrapper>
      );
    }
  );
}
