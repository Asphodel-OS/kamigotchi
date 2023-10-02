import React from 'react';
import { of } from 'rxjs';
import { questsIcon } from 'assets/images/icons/menu';

import { MenuButton } from 'layers/react/components/library/MenuButton';
import { registerUIComponent } from 'layers/react/engine/store';
import { dataStore } from 'layers/react/store/createStore';

export function registerQuestsButton() {
  registerUIComponent(
    'QuestsButton',
    {
      colStart: 82,
      colEnd: 85,
      rowStart: 3,
      rowEnd: 10,
    },
    (layers) => of(layers),
    () => {
      const { visibleButtons } = dataStore();
      const modalsToHide = { help: false };

      return (
        <MenuButton
          id='quests_button'
          targetDiv='quests'
          text='Quests'
          hideModal={modalsToHide}
          visible={visibleButtons.chat}
        >
          <img style={{ height: '100%', width: 'auto' }} src={questsIcon} alt='chat_icon' />
        </MenuButton>
      );
    }
  );
}
