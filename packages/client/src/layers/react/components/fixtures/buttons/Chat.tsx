import React from 'react';
import { of } from 'rxjs';
import chatImage from 'assets/images/icons/chat_native.png';

import { MenuButton } from 'layers/react/components/library/MenuButton';
import { registerUIComponent } from 'layers/react/engine/store';
import { dataStore } from 'layers/react/store/createStore';

export function registerChatButton() {
  registerUIComponent(
    'ChatButton',
    {
      colStart: 82,
      colEnd: 85,
      rowStart: 3,
      rowEnd: 10,
    },
    (layers) => of(layers),
    () => {
      const { visibleButtons } = dataStore();
      const modalsToHide = { help: false, settings: false };

      return (
        <MenuButton
          id='chat_button'
          targetDiv='chat'
          text='Chat'
          hideModal={modalsToHide}
          visible={visibleButtons.chat}
        >
          <img style={{ height: '100%', width: 'auto' }} src={chatImage} alt='chat_icon' />
        </MenuButton>
      );
    }
  );
}
