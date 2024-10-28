import { questsIcon } from 'assets/images/icons/menu';

import { Modals } from 'app/stores';
import { MenuButton } from './MenuButton';

export const QuestMenuButton = () => {
  const modalsToHide: Partial<Modals> = {
    bridgeERC20: false,
    bridgeERC721: false,
    chat: false,
    dialogue: false,
    emaBoard: false,
    help: false,
    inventory: false,
    leaderboard: false,
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
