import { Modals } from 'app/stores';
import { KamiIcon } from 'assets/images/icons/menu';
import { MenuButton } from './MenuButton';

export const PartyMenuButton = () => {
  const modalsToHide: Partial<Modals> = {
    account: false,
    bridgeERC20: false,
    dialogue: false,
    kami: false,
    leaderboard: false,
    map: false,
    merchant: false,
  };

  return (
    <MenuButton
      id='party_button'
      image={KamiIcon}
      tooltip='Party'
      targetModal='party'
      hideModals={modalsToHide}
    />
  );
};
