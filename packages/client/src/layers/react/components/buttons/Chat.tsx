import React from 'react';
import { of } from 'rxjs';

import { MenuButton } from 'layers/react/components/library/MenuButton';
import { registerUIComponent } from 'layers/react/engine/store';

export function registerChatButton() {
  registerUIComponent(
    'ChatButton',
    {
      colStart: 87,
      colEnd: 99,
      rowStart: 2,
      rowEnd: 10,
    },
    (layers) => of(layers),
    () => {
      return (
        <MenuButton id="chat_button" targetDiv="chat">
          Chat
        </MenuButton>
      );
    }
  );
}
