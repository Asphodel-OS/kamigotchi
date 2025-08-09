import { Modals } from 'app/stores';
import { FeedIcon } from 'assets/images/icons/actions';
import { MenuButton } from './MenuButton';

const ModalsToHide: Partial<Modals> = {
  chat: false,
  help: false,
  quests: false,
  settings: false,
};

export const LootBoxButton = () => {
  return (
    <MenuButton
      id='lootbox-button'
      image={FeedIcon}
      tooltip='Loot Box'
      targetModal='lootBox'
      hideModals={ModalsToHide}
    />
  );
};
