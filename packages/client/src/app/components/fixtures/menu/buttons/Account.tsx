import { MenuButton } from 'app/components/library';
import { Modals, useAccount, useSelected } from 'app/store';
import { operatorIcon } from 'assets/images/icons/menu';

export const AccountMenuButton = () => {
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
      targetModal='account'
      hideModals={modalsToHide}
      onClick={() => setAccount(account.index)}
    />
  );
};
