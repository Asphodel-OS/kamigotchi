import { socialIcon } from 'assets/images/icons/menu';
import { of } from 'rxjs';

import { MenuButton } from 'layers/react/components/library/MenuButton';
import { registerUIComponent } from 'layers/react/engine/store';
import { Modals, useVisibility } from 'layers/react/store';

export function registerSocialButton() {
  registerUIComponent(
    'SocialButton',
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
        inventory: false,
        kami: false,
        leaderboard: false,
        nameKami: false,
        settings: false,
        quests: false,
      };

      return (
        <MenuButton
          id='social_button'
          image={socialIcon}
          tooltip='social'
          targetDiv='social'
          hideModals={modalsToHide}
          visible={buttons.party}
        />
      );
    }
  );
}
