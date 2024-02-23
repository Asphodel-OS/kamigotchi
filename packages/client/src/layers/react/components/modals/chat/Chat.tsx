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
    (layers) =>
      interval(3333).pipe(
        map(() => {
          const account = getAccountFromBurner(layers.network, { friends: true });

          return {
            network: layers.network,
            data: { account },
          };
        })
      ),

    ({ network, data }) => {
      const { account } = data;
      return (
        <ModalWrapper
          divName='chat'
          id='chat_modal'
          header={<ModalHeader title='Chat' icon={chatIcon} />}
          footer={<InputRow account={account} />}
          canExit
        >
          <Feed />
        </ModalWrapper>
      );
    }
  );
}
