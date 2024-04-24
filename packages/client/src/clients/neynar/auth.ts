import { NeynarAPIClient } from '@neynar/nodejs-sdk';
import { FarcasterUser } from './users';

export const client = new NeynarAPIClient(import.meta.env.VITE_NEYNAR_API_KEY!);

// farcaster sign-in handling through neynar
// spawns a window and listens for the resulting message event
let authWindow: Window | null;
export const handleSignIn = () => {
  const loginURL = import.meta.env.VITE_NEYNAR_LOGIN_URL; // https://app.neynar.com/login
  const clientID = import.meta.env.VITE_NEYNAR_CLIENT_ID;
  const redirectURI = import.meta.env.VITE_NEYNAR_REDIRECT_URI;
  if (!loginURL || !clientID) {
    return console.error(
      'Required environment variable(s) not set.',
      `NEYNAR_LOGIN_URL: ${loginURL}`,
      `NEYNAR_CLIENT_ID: ${clientID}`
    );
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
    updateLocalStorage(e.data.fid, e.data.signer_uuid);
    if (authWindow) authWindow.close();
    window.removeEventListener('message', (e) => handleMessage(e, authOrigin));
  }
};

// update local storage with Farcaster User/Auth data
async function updateLocalStorage(fid: number, uuid: string) {
  const response = await client.fetchBulkUsers([fid], {});
  if (response.users.length > 0) {
    const user = response.users[0] as FarcasterUser;
    user.signer_uuid = uuid;
    localStorage.setItem('farcasterUser', JSON.stringify(user));
    window.dispatchEvent(new StorageEvent('local-storage', { key: 'farcasterUser' }));
    console.log('set farcaster user in localstorage', user);
  }
}
