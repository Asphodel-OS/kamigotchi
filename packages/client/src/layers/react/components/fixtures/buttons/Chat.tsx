import { of } from 'rxjs';

import { chatIcon } from 'assets/images/icons/menu';
import { MenuButton } from 'layers/react/components/library/MenuButton';
import { registerUIComponent } from 'layers/react/engine/store';
import { Modals, useVisibility } from 'layers/react/store/visibility';

export function registerChatButton() {
  registerUIComponent(
    'ChatButton',
    {
      colStart: 76,
      colEnd: 79,
      rowStart: 3,
      rowEnd: 10,
    },
    (layers) => of(layers),
    () => {
      const { buttons } = useVisibility();
      const modalsToHide: Partial<Modals> = {
        bridgeERC20: false,
        bridgeERC721: false,
        dialogue: false,
        emaBoard: false,
        help: false,
        kami: false,
        inventory: false,
        leaderboard: false,
        nameKami: false,
        quests: false,
        settings: false,
      };

      return (
        <MenuButton
          id='chat-button'
          image={chatIcon}
          tooltip='Chat'
          targetDiv='chat'
          hideModals={modalsToHide}
          visible={buttons.chat}
        />
      );
    }
  );
}
