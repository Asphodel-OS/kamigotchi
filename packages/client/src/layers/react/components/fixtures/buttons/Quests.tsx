import { questsIcon } from 'assets/images/icons/menu';
import { of } from 'rxjs';

import { MenuButton } from 'layers/react/components/library/MenuButton';
import { registerUIComponent } from 'layers/react/engine/store';
import { Modals, useVisibility } from 'layers/react/store';

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
      const { buttons } = useVisibility();
      const modalsToHide: Partial<Modals> = {
        bridgeERC20: false,
        bridgeERC721: false,
        chat: false,
        dialogue: false,
        emaBoard: false,
        help: false,
        inventory: false,
        kami: false,
        leaderboard: false,
        nameKami: false,
        settings: false,
        social: false,
      };

      return (
        <MenuButton
          id='quests_button'
          image={questsIcon}
          tooltip='Quests'
          targetDiv='quests'
          hideModals={modalsToHide}
          visible={buttons.quests}
        />
      );
    }
  );
}
