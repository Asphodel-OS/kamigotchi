import { useAccount } from 'layers/react/store/account';

let authWindow: any;
export const handleSignIn = (neynarLoginUrl: string, clientId: string, redirectUri: string) => {
  console.log('handleSignIn', neynarLoginUrl, clientId, redirectUri);
  let authUrl = new URL(neynarLoginUrl);
  authUrl.searchParams.append('client_id', clientId);
  if (redirectUri) {
    authUrl.searchParams.append('redirect_uri', redirectUri);
  }

  const authOrigin = new URL(neynarLoginUrl).origin;
  authWindow = window.open(authUrl.toString(), '_blank');
  window.addEventListener(
    'message',
    function (event) {
      handleMessage(event, authOrigin);
    },
    false
  );
};

const handleMessage = (event: any, authOrigin: string) => {
  if (event.origin === authOrigin && event.data.is_authenticated) {
    // set the Farcaster User Data here
    console.log('handling message', event.data);

    const { account } = useAccount.getState();
    useAccount.setState({
      account: {
        ...account,
        fid: event.data.fid,
        neynar_signer: event.data.signer_uuid,
      },
    });

    if (authWindow) {
      authWindow.close();
    }

    window.removeEventListener('message', handleMessage);
  }
};
