import { useLogin, usePrivy, useWallets } from '@privy-io/react-auth';

import { ActionButton } from '../../../library';

export const LoginMenuButton = () => {
  const { ready, authenticated, logout } = usePrivy();
  const { wallets } = useWallets();
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
    if (authenticated) return 'Disconnect';
    return 'Connnect';
  };

  return <ActionButton onClick={handleClick} text={getText()} size='menu' disabled={!ready} />;
};
