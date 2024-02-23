import { NeynarAPIClient } from '@neynar/nodejs-sdk';
import { useAccount } from 'layers/react/store/account';

export const client = new NeynarAPIClient(process.env.NEYNAR_API_KEY!);

export interface FarcasterUser {
  fid: number;
  username: string;
  display_name: string;
  custody_address: string;
  pfp_url: string;
  signer_uuid: string;
}

export const emptyFaracasterUser: FarcasterUser = {
  fid: 0,
  username: '',
  display_name: '',
  custody_address: '',
  pfp_url: '',
  signer_uuid: '',
};

// farcaster sign-in handling through neynar
// spawns a window and listens for the resulting message event
let authWindow: Window | null;
export const handleSignIn = () => {
  const loginURL = process.env.NEYNAR_LOGIN_URL; // https://app.neynar.com/login
  const clientID = process.env.NEYNAR_CLIENT_ID;
  const redirectURI = process.env.NEYNAR_REDIRECT_URI;
  if (!loginURL || !clientID) {
    console.error('NEYNAR_LOGIN_URL or NEYNAR_CLIENT_ID environment variable not set.');
    return;
  }

  console.log('Connecting to Farcaster with Neynar');

  // set the auth url
  let authUrl = new URL(loginURL);
  authUrl.searchParams.append('client_id', clientID);
  if (redirectURI) authUrl.searchParams.append('redirect_uri', redirectURI);

  // spawn window and event listener
  const authOrigin = new URL(loginURL).origin;
  authWindow = window.open(authUrl.toString(), '_blank');
  window.addEventListener(
    'message',
    function (event) {
      handleMessage(event, authOrigin);
    },
    false
  );
};

// sets the farcaster user in the Account Store from a subscribed message event
const handleMessage = (event: MessageEvent, authOrigin: string) => {
  if (event.origin === authOrigin && event.data.is_authenticated) {
    console.log('handling message', event.data);
    // set the Farcaster User Data here
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
