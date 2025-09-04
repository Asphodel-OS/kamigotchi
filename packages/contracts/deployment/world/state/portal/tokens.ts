import { AdminAPI } from '../../api';
import { getSheet } from '../utils';

// register a token with an existing item
async function init(api: AdminAPI, entry: any) {
  const index = Number(entry['Item Index']);
  const address = entry['Address'];
  const scale = Number(entry['Scale']);
  console.log(`registering item (${index}) at 1e${scale} scale with ${address}`);

  await api.portal.token.set(index, address, scale);
}

// register some items on the registry as token items
// NOTE: this is defined this way because the scripts can handle single number inputs..
export async function initTokens(api: AdminAPI, indices: number[]) {
  const tokensCSV = await getSheet('portal', 'tokens');
  if (!tokensCSV) return console.log('No portal/tokens.csv found');

  if (indices.length == 0) return console.log('No tokens given to initialize');
  else if (indices.length > 1) return console.log(`More than one token provided`);
  const index = indices[0];

  console.log('\n==INITIALIZING TOKENS==');

  // iterate through rows of items
  for (let i = 0; i < tokensCSV.length; i++) {
    const row = tokensCSV[i];
    if (Number(row['Item Index']) != index) continue;

    try {
      console.log(`initializing item ${index} as token`);
      await init(api, row);
    } catch {
      console.error('Could not register token', index);
      continue;
    }
  }
}

// delete specified items
// TODO: consider supporting sheet data-based deletion marking
export async function deleteTokens(api: AdminAPI, indices: number[]) {
  console.log('\n==UNSETTING TOKENS==');
  for (let i = 0; i < indices.length; i++) {
    try {
      console.log(`Deregistering item ${indices[i]} from token portal`);
      await api.portal.token.unset(indices[i]);
    } catch {
      console.error('Could not unset token details from item ' + indices[i]);
    }
  }
}

export async function initLocalTokens(api: AdminAPI) {
  await api.portal.token.setLocal(100);
}
