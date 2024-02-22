import { NeynarAPIClient } from '@neynar/nodejs-sdk';

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

export const client = new NeynarAPIClient(process.env.NEYNAR_API_KEY!);
