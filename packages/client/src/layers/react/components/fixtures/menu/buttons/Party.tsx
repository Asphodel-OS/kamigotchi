import { kamiIcon } from 'assets/images/icons/menu';
import { MenuButton } from 'layers/react/components/library/MenuButton';
import { Modals } from 'layers/react/store';

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
