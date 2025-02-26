import { Modals } from 'app/stores';
import { ItemImages } from 'assets/images/items';
import { MenuButton } from './MenuButton';

interface Props {
  disabled?: boolean;
}

export const PresaleMenuButton = (props: Props) => {
  const { disabled } = props;

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
    node: false,
    chat: false,
    quests: false,
  };

  return (
    <MenuButton
      id='presale_button'
      image={ItemImages.onyx}
      tooltip={disabled ? 'Disabled' : 'Presale'}
      targetModal='presale'
      hideModals={modalsToHide}
      onClick={() => {}}
      disabled={disabled}
    />
  );
};
