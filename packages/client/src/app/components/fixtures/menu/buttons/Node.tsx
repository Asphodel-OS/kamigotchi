import { MenuButton } from 'app/components/library';
import { Modals, useSelected } from 'app/stores';
import { harvestIcon } from 'assets/images/icons/actions';

export const NodeMenuButton = () => {
  const { roomIndex, setNode } = useSelected(); // roomIndex == nodeIndex

  const modalsToHide: Partial<Modals> = {
    bridgeERC20: false,
    bridgeERC721: false,
    dialogue: false,
    kami: false,
    gacha: false,
    emaBoard: false,
    nameKami: false,
  };

  return (
    <MenuButton
      id='party_button'
      image={harvestIcon}
      tooltip='Harvest'
      targetModal='node'
      hideModals={modalsToHide}
      // nodeModal relies on roomIndex; leaving here for now
      // onClick={() => setNode(roomIndex)}
    />
  );
};
