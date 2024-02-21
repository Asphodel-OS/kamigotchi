import { of } from 'rxjs';

import { chatIcon } from 'assets/images/icons/menu';
import { ModalHeader } from 'layers/react/components/library/ModalHeader';
import { ModalWrapper } from 'layers/react/components/library/ModalWrapper';
import { registerUIComponent } from 'layers/react/engine/store';
import 'layers/react/styles/font.css';
import { Feed } from './Feed';

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

    (layers) => of(layers),

    () => {
      return (
        <ModalWrapper
          divName='chat'
          id='chat_modal'
          header={<ModalHeader title='Chat' icon={chatIcon} />}
          canExit
        >
          <Feed />
        </ModalWrapper>
      );
    }
  );
}
