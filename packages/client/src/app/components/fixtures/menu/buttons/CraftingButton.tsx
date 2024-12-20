import { Modals } from 'app/stores';
import { CraftIcon } from 'assets/images/icons/actions';
import { MenuButton } from './MenuButton';

export const CraftingButton = () => {
  const modalsToHide: Partial<Modals> = {
    bridgeERC20: false,
    bridgeERC721: false,
    dialogue: false,
    emaBoard: false,
    help: false,
    inventory: false,
    leaderboard: false,
    nameKami: false,
    quests: false,
    settings: false,
    node: false,
  };

  return (
    <MenuButton
      id='craft-button'
      image={CraftIcon}
      tooltip='Craft'
      targetModal='crafting'
      hideModals={modalsToHide}
    />
  );
};
