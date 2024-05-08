import { useLogin, usePrivy, useWallets } from '@privy-io/react-auth';

import { useAccount } from 'layers/react/store';
import { getAbbreviatedAddress } from 'utils/address';
import { ActionButton, Tooltip } from '../../../library';

export const LoginMenuButton = () => {
  const { ready, authenticated, logout } = usePrivy();
  const { wallets } = useWallets();
  const { account } = useAccount();
  const { login } = useLogin({
    onComplete: (user, isNewUser, wasAlreadyAuthenticated) => {},
    onError: (error) => {
      console.error(error);
    },
  });

  const handleClick = () => {
    if (ready && !authenticated) login();
    if (ready && authenticated) logout();
  };

  const getText = () => {
    if (!ready) return 'Loading..';
    if (authenticated) return getAbbreviatedAddress(account.ownerAddress);
    return 'Connnect'; // should never be displayed as this
  };

  return (
    <Tooltip text={['Disconnect']}>
      <ActionButton onClick={handleClick} text={getText()} size='menu' disabled={!ready} />
    </Tooltip>
  );
};
