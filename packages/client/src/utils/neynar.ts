let authWindow: any;

const handleMessage = (event, authOrigin: string) => {
  if (event.origin === authOrigin && event.data.is_authenticated) {
    // set the Farcaster User Data here
    console.log('handling message', event.data);

    if (authWindow) {
      authWindow.close();
    }

    window.removeEventListener('message', handleMessage);
  }
};

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
