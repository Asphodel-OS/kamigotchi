import { AdminAPI } from '../api';
import { readFile } from './utils';

export async function initTestingWorldWL(api: AdminAPI) {
  const whitelistsCSV = await readFile('envs/testing/whitelists/addresses.csv');

  for (let i = 0; i < whitelistsCSV.length; i++) {
    const entry = whitelistsCSV[i];
    try {
      await api.setup.testing.account.wl(entry['Address']);
    } catch (e) {}
  }
}
