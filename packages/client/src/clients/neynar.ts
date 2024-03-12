import { NeynarAPIClient } from '@neynar/nodejs-sdk';
import { User } from '@neynar/nodejs-sdk/build/neynar-api/v2';
import { useAccount } from 'layers/react/store/account';

export const client = new NeynarAPIClient(import.meta.env.VITE_NEYNAR_API_KEY!);

interface UUIDHolder {
  signer_uuid?: string;
}
export interface FarcasterUser extends User, UUIDHolder {}

// this is so retarded, but necessary to work with Farcaster's User object
export const emptyFaracasterUser: FarcasterUser = {
  object: 'user',
  fid: 0,
  username: '',
  display_name: '',
  custody_address: '',
  pfp_url: '',
  follower_count: 0,
  following_count: 0,
  verifications: [],
  verified_addresses: { eth_addresses: [], sol_addresses: [] },
  active_status: 'inactive',
  viewer_context: { following: false, followed_by: false },
  profile: { bio: { text: '', mentioned_profiles: [] } },
};

// farcaster sign-in handling through neynar
// spawns a window and listens for the resulting message event
let authWindow: Window | null;
export const handleSignIn = () => {
  const loginURL = import.meta.env.VITE_NEYNAR_LOGIN_URL; // https://app.neynar.com/login
  const clientID = import.meta.env.VITE_NEYNAR_CLIENT_ID;
  const redirectURI = import.meta.env.VITE_NEYNAR_REDIRECT_URI;
  if (!loginURL || !clientID) {
    console.error(
      'Required environment variable(s) not set.',
      `NEYNAR_LOGIN_URL: ${loginURL}`,
      `NEYNAR_CLIENT_ID: ${clientID}`
    );
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
  window.addEventListener('message', (e) => handleMessage(e, authOrigin), false);
};

// sets the farcaster user in the Account Store from a subscribed message event
const handleMessage = (e: MessageEvent, authOrigin: string) => {
  if (e.origin === authOrigin && e.data.is_authenticated) {
    // set Farcaster user data here
    const { account } = useAccount.getState();
    useAccount.setState({
      account: {
        ...account,
        fid: e.data.fid,
        neynar_signer: e.data.signer_uuid,
      },
    });

    // clean up
    if (authWindow) authWindow.close();
    window.removeEventListener('message', (e) => handleMessage(e, authOrigin));
  }
};
