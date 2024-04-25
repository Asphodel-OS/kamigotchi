import { CastWithInteractions } from '@neynar/nodejs-sdk/build/neynar-api/v2';
import { useState } from 'react';
import { interval, map } from 'rxjs';

import { chatIcon } from 'assets/images/icons/menu';
import { getAccountFromBurner } from 'layers/network/shapes/Account';
import { ModalHeader, ModalWrapper } from 'layers/react/components/library';
import { registerUIComponent } from 'layers/react/engine/store';
import moment from 'moment';
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

      const pushCasts = (newCasts: CastWithInteractions[]) => {
        // split the new casts into unique and duplicates
        const uniqueCasts = [];
        for (const [i, cast] of newCasts.entries()) {
          if (casts.find((c) => c.hash === cast.hash)) casts[i] = cast;
          else uniqueCasts.push(cast);
        }

        // sort the casts
        const allCasts = [...uniqueCasts, ...casts];
        allCasts.sort((a, b) => moment(b.timestamp).diff(moment(a.timestamp)));
        setCasts(allCasts);

        console.log(
          `casts pushed`,
          `old: ${casts.length} `,
          `new: ${uniqueCasts.length} `,
          `repeated: ${newCasts.length - uniqueCasts.length}`,
          `total: ${allCasts.length}`
        );
      };

      return (
        <ModalWrapper
          divName='chat'
          id='chat_modal'
          header={<ModalHeader title='Chat' icon={chatIcon} />}
          footer={<InputRow account={account} actions={{ pushCast }} actionSystem={actions} />}
          canExit
        >
          <Feed max={maxCasts} casts={casts} actions={{ setCasts, pushCasts }} />
        </ModalWrapper>
      );
    }
  );
}
