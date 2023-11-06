import React from 'react';
import { of } from 'rxjs';
import { chatIcon } from 'assets/images/icons/menu';

import { MenuButton } from 'layers/react/components/library/MenuButton';
import { registerUIComponent } from 'layers/react/engine/store';
import { dataStore } from 'layers/react/store/createStore';

export function registerChatButton() {
  registerUIComponent(
    'ChatButton',
    {
      colStart: 73,
      colEnd: 76,
      rowStart: 3,
      rowEnd: 10,
    },
    (layers) => of(layers),
    () => {
      const { visibleButtons } = dataStore();
      const modalsToHide = { help: false, settings: false, quests: false };

      return (
        <MenuButton
          id='chat_button'
          image={chatIcon}
          tooltip='Chat'
          targetDiv='lootboxes'
          hideModals={modalsToHide}
          visible={visibleButtons.chat}
        />
      );
    }
  );
}
