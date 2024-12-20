import { Modals } from 'app/stores';
import { InventoryIcon } from 'assets/images/icons/menu';
import { MenuButton } from './MenuButton';

export const InventoryMenuButton = () => {
  const modalsToHide: Partial<Modals> = {
    bridgeERC20: false,
    bridgeERC721: false,
    chat: false,
    dialogue: false,
    emaBoard: false,
    help: false,
    leaderboard: false,
    nameKami: false,
    quests: false,
    settings: false,
  };

  return (
    <MenuButton
      id='inventory-button'
      image={InventoryIcon}
      tooltip='Inventory'
      targetModal='inventory'
      hideModals={modalsToHide}
    />
  );
};
