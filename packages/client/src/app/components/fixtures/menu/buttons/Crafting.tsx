import { Modals } from 'app/stores';
import { CraftIcon } from 'assets/images/icons/actions';
import { MenuButton } from './MenuButton';

export const CraftMenuButton = () => {
  const modalsToHide: Partial<Modals> = {
    bridgeERC20: false,
    bridgeERC721: false,
    dialogue: false,
    emaBoard: false,
    kami: false,
    leaderboard: false,
    nameKami: false,
    node: false,
    presale: false,
    trading: false,
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
