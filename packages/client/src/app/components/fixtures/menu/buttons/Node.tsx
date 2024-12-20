import { Modals, useSelected } from 'app/stores';
import { HarvestIcon } from 'assets/images/icons/actions';
import { MenuButton } from './MenuButton';

interface Props {
  disabled?: boolean;
}

export const NodeMenuButton = (props: Props) => {
  const { disabled } = props;
  const { roomIndex, setNode } = useSelected(); // roomIndex == nodeIndex

  const modalsToHide: Partial<Modals> = {
    goal: false,
    crafting: false,
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
      image={HarvestIcon}
      tooltip={disabled ? 'There is no node here.' : 'Harvest'}
      targetModal='node'
      hideModals={modalsToHide}
      onClick={() => setNode(roomIndex)}
      disabled={disabled}
    />
  );
};
