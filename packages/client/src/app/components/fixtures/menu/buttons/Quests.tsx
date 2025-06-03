import { QuestsIcon } from 'assets/images/icons/menu';

import { Modals } from 'app/stores';
import { MenuButton } from './MenuButton';

const ModalsToHide: Partial<Modals> = {
  chat: false,
  help: false,
  inventory: false,
  settings: false,
};

export const QuestMenuButton = () => {
  return (
    <MenuButton
      id='quests_button'
      image={QuestsIcon}
      tooltip='Quests'
      targetModal='quests'
      hideModals={ModalsToHide}
    />
  );
};
