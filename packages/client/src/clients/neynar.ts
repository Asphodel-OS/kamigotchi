import { NeynarAPIClient } from '@neynar/nodejs-sdk';

export const client = new NeynarAPIClient(process.env.NEYNAR_API_KEY!);
