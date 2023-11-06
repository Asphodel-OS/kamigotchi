import React from 'react';
import { of } from 'rxjs';
import { questsIcon } from 'assets/images/icons/menu';

import { MenuButton } from 'layers/react/components/library/MenuButton';
import { registerUIComponent } from 'layers/react/engine/store';
import { VisibleModals, dataStore } from 'layers/react/store/createStore';

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
      const modalsToHide: Partial<VisibleModals> = {
        bridgeERC20: false,
        bridgeERC721: false,
        dialogue: false,
        emaBoard: false,
        help: false,
        inventory: false,
        kami: false,
        leaderboard: false,
        nameKami: false,
        settings: false,
      };


      return (
        <MenuButton
          id='quests_button'
          image={questsIcon}
          tooltip='Quests'
          targetDiv='quests'
          hideModals={modalsToHide}
          visible={visibleButtons.quests}
        />
      );
    }
  );
}
