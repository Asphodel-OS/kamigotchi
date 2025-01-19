import { CastWithInteractions } from '@neynar/nodejs-sdk/build/neynar-api/v2';
import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';

import { ModalHeader, ModalWrapper } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { ChatIcon } from 'assets/images/icons/menu';
import { KamidenServiceClient, Message } from 'engine/types/kamiden/kamiden';
import moment from 'moment';
import { getAccountFromEmbedded } from 'network/shapes/Account';
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
      const [casts, setCasts] = useState<CastWithInteractions[]>([]);
      const maxCasts = 100;
      const [kamidenMessages, setKamidenMessages] = useState<Message[]>([]);

      useEffect(() => {
        // Initialize Kamiden client and fetch initial messages
        const initKamiden = async () => {
          try {
            console.log('Initializing Kamiden client');
            const client = {} as KamidenServiceClient; // TODO: Initialize your client

            // Get initial messages for room 0
            const response = await client.getRoomMessages({ RoomIndex: 0 });
            setKamidenMessages(response.Messages);

            // Subscribe to new messages
            const messageStream = client.subscribeToStream({});
            for await (const streamResponse of messageStream) {
              console.log('hi');
              setKamidenMessages((prev) => [...streamResponse.Messages, ...prev]);
            }
          } catch (error) {
            console.error('Error connecting to Kamiden:', error);
          }
        };
        console.log('In useEffect for init');
        initKamiden();
      }, []);

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
