import { MenuButton } from 'app/components/library';
import { Modals } from 'app/store';
import { kamiIcon } from 'assets/images/icons/menu';

export const PartyMenuButton = () => {
  const modalsToHide: Partial<Modals> = {
    account: false,
    bridgeERC20: false,
    bridgeERC721: false,
    dialogue: false,
    emaBoard: false,
    kami: false,
    leaderboard: false,
    map: false,
    nameKami: false,
  };

  return (
    <MenuButton
      id='party_button'
      image={kamiIcon}
      tooltip='Party'
      targetModal='party'
      hideModals={modalsToHide}
    />
  );
};
