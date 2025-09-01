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
export async function initTokens(api: AdminAPI, indices?: number[], all?: boolean) {
  const tokensCSV = await getSheet('portal', 'tokens');
  if (!tokensCSV) return console.log('No portal/tokens.csv found');
  if (indices && indices.length == 0) return console.log('No tokens given to initialize');
  console.log('\n==INITIALIZING TOKENS==');

  // iterate through rows of items
  for (let i = 0; i < tokensCSV.length; i++) {
    const row = tokensCSV[i];
    const index = Number(row['Index']);

    // if indices are overridden skip any not included, otherwise check status
    if (indices && indices.length > 0) {
      if (!indices.includes(index)) continue;
    }

    // attempt item creation
    try {
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
