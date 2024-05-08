import { inventoryIcon } from 'assets/images/icons/menu';
import { MenuButton } from 'layers/react/components/library/MenuButton';
import { Modals, useVisibility } from 'layers/react/store';

export const InventoryMenuButton = () => {
  const { buttons } = useVisibility();
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
      targetDiv='inventory'
      hideModals={modalsToHide}
      visible={buttons.inventory}
    />
  );
};
