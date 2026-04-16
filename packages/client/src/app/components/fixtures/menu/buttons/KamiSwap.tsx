import { Modals } from 'app/stores';
import { MarketplaceIcon } from 'assets/images/icons/menu';
import { MenuButton } from './MenuButton';

const ModalsToHide: Partial<Modals> = {
  crafting: false,
  trading: false,
  inventory: false,
  lootBox: false,
};

export const KamiSwapMenuButton = () => {
  return (
    <MenuButton
      id='kamiswap-button'
      image={MarketplaceIcon}
      tooltip='KamiSwap'
      targetModal='marketplace'
      hideModals={ModalsToHide}
    />
  );
};
