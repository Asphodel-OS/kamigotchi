import { CastWithInteractions } from '@neynar/nodejs-sdk/build/neynar-api/v2';
import { useState } from 'react';
import { interval, map } from 'rxjs';

import { chatIcon } from 'assets/images/icons/menu';
import { getAccountFromBurner } from 'layers/network/shapes/Account';
import { ModalHeader, ModalWrapper } from 'layers/react/components/library';
import { registerUIComponent } from 'layers/react/engine/store';
import { Feed } from './Feed';
import { InputRow } from './InputRow';

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
          const account = getAccountFromBurner(network, { friends: true });
          return {
            data: { account },
            network,
          };
        })
      );
    },
    ({ data, network }) => {
      const { account } = data;
      const { actions } = network;
      const [casts, setCasts] = useState<CastWithInteractions[]>([]);
      const maxCasts = 100;

      const pushCast = (cast: CastWithInteractions) => {
        setCasts([cast, ...casts]);
      };

      // filter out duplicates and sort by timestamp
      // possibly limit the length of the list
      const setCastsFiltered = (newCasts: CastWithInteractions[]) => {
        setCasts(newCasts.filter((cast) => !casts.find((c) => c.hash === cast.hash)));
      };

      return (
        <ModalWrapper
          divName='chat'
          id='chat_modal'
          header={<ModalHeader title='Chat' icon={chatIcon} />}
          footer={<InputRow account={account} actions={{ pushCast }} actionSystem={actions} />}
          canExit
        >
          <Feed max={maxCasts} casts={casts} setCasts={setCasts} />
        </ModalWrapper>
      );
    }
  );
}
