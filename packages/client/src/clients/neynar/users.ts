import { User } from '@neynar/nodejs-sdk/build/neynar-api/v2';
import { client } from './auth';

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
  power_badge: false,
};

// get a farcaster user by their
export async function getUser(fid: number) {
  try {
    const response = await client.fetchBulkUsers([fid], {});
    return response.users[0] as FarcasterUser;
  } catch (e) {
    console.error(e);
  }
}
