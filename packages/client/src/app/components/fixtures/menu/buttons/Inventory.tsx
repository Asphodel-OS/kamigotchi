import { Modals } from 'app/stores';
import { InventoryIcon } from 'assets/images/icons/menu';
import { MenuButton } from './MenuButton';

const ModalsToHide: Partial<Modals> = {
  chat: false,
  help: false,
  quests: false,
  settings: false,
};

export const InventoryMenuButton = () => {
  return (
    <MenuButton
      id='inventory-button'
      image={InventoryIcon}
      tooltip='Inventory'
      targetModal='inventory'
      hideModals={ModalsToHide}
    />
  );
};
