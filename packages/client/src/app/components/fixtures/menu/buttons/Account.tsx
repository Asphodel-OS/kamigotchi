import { Modals, useAccount, useSelected } from 'app/stores';
import { OperatorIcon } from 'assets/images/icons/menu';
import { MenuButton } from './MenuButton';

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
    merchant: false,
    party: false,
  };

  return (
    <MenuButton
      id='account_button'
      image={OperatorIcon}
      tooltip={`Account`}
      targetModal='account'
      hideModals={modalsToHide}
      onClick={() => setAccount(account.index)}
    />
  );
};
