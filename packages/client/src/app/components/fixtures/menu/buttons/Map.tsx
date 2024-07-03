import { Modals } from 'app/stores';
import { mapIcon } from 'assets/images/icons/menu';
import { MenuButton } from './MenuButton';

export const MapMenuButton = () => {
  const modalsToHide: Partial<Modals> = {
    account: false,
    bridgeERC20: false,
    bridgeERC721: false,
    dialogue: false,
    emaBoard: false,
    kami: false,
    leaderboard: false,
    nameKami: false,
    party: false,
  };

  return (
    <MenuButton
      id='map_button'
      image={mapIcon}
      tooltip={`Map`}
      targetModal='map'
      hideModals={modalsToHide}
    />
  );
};
