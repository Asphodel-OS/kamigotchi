import React from 'react';
import { of } from 'rxjs';
import chatImage from '../../../../assets/images/chat_native.png';

import { MenuButton } from 'layers/react/components/library/MenuButton';
import { registerUIComponent } from 'layers/react/engine/store';
import { dataStore } from 'layers/react/store/createStore';

export function registerChatButton() {
  registerUIComponent(
    'ChatButton',
    {
      colStart: 85,
      colEnd: 88,
      rowStart: 3,
      rowEnd: 10,
    },
    (layers) => of(layers),
    () => {
      const {
        visibleModals: { chatButton },
      } = dataStore();

      const hideSettingsModal = { help: false };

      return (
        <MenuButton
          id='chat_button'
          targetDiv='chat'
          text='Chat'
          hideModal={hideSettingsModal}
          visible={chatButton}
        >
          <img style={{ height: '100%', width: 'auto' }} src={chatImage} alt='chat_icon' />
        </MenuButton>
      );
    }
  );
}
