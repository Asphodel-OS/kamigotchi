import { operatorIcon } from 'assets/images/icons/menu';
import { MenuButton } from 'layers/react/components/library/MenuButton';
import { Modals, useAccount, useSelected, useVisibility } from 'layers/react/store';

export const AccountMenuButton = () => {
  const { buttons } = useVisibility();
  const { setAccount } = useSelected();
  const { account } = useAccount();

  const modalsToHide: Partial<Modals> = {
    bridgeERC20: false,
    bridgeERC721: false,
    dialogue: false,
    emaBoard: false,
    kami: false,
    leaderboard: false,
    map: false,
    nameKami: false,
    party: false,
  };

  return (
    <MenuButton
      id='account_button'
      image={operatorIcon}
      tooltip={`Account`}
      targetDiv='account'
      visible={buttons.account}
      hideModals={modalsToHide}
      onClick={() => setAccount(account.index)}
    />
  );
};
