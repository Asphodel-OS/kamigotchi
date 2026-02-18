import { Modals } from 'app/stores';
import VendIcon from 'assets/images/rooms/18_cave-crossroads/vend.png';
import { MenuButton } from './MenuButton';

export const MarketplaceMenuButton = () => {
  const modalsToHide: Partial<Modals> = {
    bridgeERC20: false,
    bridgeERC721: false,
    crafting: false,
    dialogue: false,
    emaBoard: false,
    gacha: false,
    goal: false,
    kami: false,
    leaderboard: false,
    node: false,
    tokenPortal: false,
    presale: false,
    trading: false,
  };

  return (
    <MenuButton
      id='marketplace-button'
      image={VendIcon}
      tooltip='Marketplace'
      targetModal='marketplace'
      hideModals={modalsToHide}
    />
  );
};
