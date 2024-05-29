import { MenuButton } from 'app/components/library';
import { Modals } from 'app/store';
import { inventoryIcon } from 'assets/images/icons/menu';

export const InventoryMenuButton = () => {
  const modalsToHide: Partial<Modals> = {
    bridgeERC20: false,
    bridgeERC721: false,
    chat: false,
    dialogue: false,
    emaBoard: false,
    help: false,
    kami: false,
    leaderboard: false,
    nameKami: false,
    quests: false,
    settings: false,
  };

  return (
    <MenuButton
      id='inventory-button'
      image={inventoryIcon}
      tooltip='Inventory'
      targetModal='inventory'
      hideModals={modalsToHide}
    />
  );
};
