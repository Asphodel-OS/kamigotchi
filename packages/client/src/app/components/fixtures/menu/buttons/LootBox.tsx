import { Modals } from 'app/stores';
import { ItemImages } from 'assets/images/items';
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
      image={ItemImages.obol}
      tooltip='Loot Box'
      targetModal='lootBox'
      hideModals={ModalsToHide}
    />
  );
};
