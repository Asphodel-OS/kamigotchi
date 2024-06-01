import { questsIcon } from 'assets/images/icons/menu';

import { MenuButton } from 'app/components/library';
import { Modals } from 'app/stores';

export const QuestMenuButton = () => {
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
  };

  return (
    <MenuButton
      id='quests_button'
      image={questsIcon}
      tooltip='Quests'
      targetModal='quests'
      hideModals={modalsToHide}
    />
  );
};
