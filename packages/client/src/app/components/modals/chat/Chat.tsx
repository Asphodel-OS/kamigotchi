import { CastWithInteractions } from '@neynar/nodejs-sdk/build/neynar-api/v2';
import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';

import { ModalHeader, ModalWrapper } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { useVisibility } from 'app/stores';
import { ChatIcon } from 'assets/images/icons/menu';
import { Message } from 'engine/types/kamiden/kamiden';
import moment from 'moment';
import { getAccountFromEmbedded } from 'network/shapes/Account';
import { getKamidenClient } from 'workers/sync/kamidenStreamClient';
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
          return {
            data: { account },
            network,
          };
        })
      );
    },
    ({ data, network }) => {
      const { account } = data;
      const { actions, api } = network;
      const { modals } = useVisibility();
      const [casts, setCasts] = useState<CastWithInteractions[]>([]);
      const maxCasts = 100;
      const [kamidenMessages, setKamidenMessages] = useState<Message[]>([]);

      useEffect(() => {
        console.log('Chat visibility changed:', modals.chat);
        if (!modals.chat) return;

        // Initialize Kamiden client and fetch initial messages
        const initKamiden = async () => {
          try {
            console.log('Initializing Kamiden client');
            const client = getKamidenClient();

            // Get initial messages for room 0
            console.log(`Fetching room messages from room ${account.roomIndex}...`);
            try {
              const response = await client.getRoomMessages({ RoomIndex: account.roomIndex });
              setKamidenMessages(response.Messages);
            } catch (e) {
              console.log('Error fetching initial messages:', e);
            }
            /*
            // Subscribe to new messages
            console.log('Setting up stream...');
            const messageStream = client.subscribeToStream({});

            const handleStream = async () => {
              try {
                console.log('Starting stream handling...');
                for await (const streamResponse of messageStream) {
                  console.log('Received message from stream:', streamResponse);
                  setKamidenMessages((prev) => [...streamResponse.Messages, ...prev]);
                }
              } catch (error) {
                console.error('Stream error:', error);
              }
            };

            handleStream();
            */
          } catch (error) {
            console.error('Error connecting to Kamiden:', error);
          }
        };

        initKamiden();

        return () => {
          console.log('Cleaning up Kamiden connection - chat closed');
        };
      }, [modals.chat]);

      const pushCast = (cast: CastWithInteractions) => {
        setCasts([cast, ...casts]);
      };

      const pushCasts = (newCasts: CastWithInteractions[]) => {
        const oldCasts = [...casts];

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
          <Feed max={maxCasts} casts={casts} actions={{ setCasts, pushCasts }} />
        </ModalWrapper>
      );
    }
  );
}
