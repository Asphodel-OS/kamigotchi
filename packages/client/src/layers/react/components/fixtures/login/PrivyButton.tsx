import { useLogin, usePrivy, useWallets } from '@privy-io/react-auth';
import { ActionButton } from '../../library';

export const PrivyButton = () => {
  const { ready, authenticated, logout } = usePrivy();
  const { wallets } = useWallets();
  const { login } = useLogin({
    onComplete: (user, isNewUser, wasAlreadyAuthenticated) => {
      // console.log(user, isNewUser, wasAlreadyAuthenticated);
      // console.log(wallets);
      // Any logic you'd like to execute if the user is/becomes authenticated while this
      // component is mounted
    },
    onError: (error) => {
      console.log(error);
      // Any logic you'd like to execute after a user exits the login flow or there is an error
    },
  });

  const handleClick = () => {
    if (ready && !authenticated) login();
    if (ready && authenticated) logout();
  };

  const getText = () => {
    if (!ready) return 'Loading..';
    if (authenticated) return 'Log Out';
    return 'Log in';
  };

  return (
    <ActionButton
      id='login-button'
      onClick={handleClick}
      text={getText()}
      size='menu'
      disabled={!ready}
    />
  );
};
