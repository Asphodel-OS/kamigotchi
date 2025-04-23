import { ethers } from 'ethers';
import { AdminAPI } from '../api';
import { readFile } from './utils';

export async function initSnapshot(api: AdminAPI) {
  await initPassports(api);
  await initGachaWhitelist(api);
}

async function initPassports(api: AdminAPI) {
  const passportCSV = await readFile('snapshot/passports.csv');

  const batchSize = 50;
  let i = 0;
  for (i; i < passportCSV.length; i += batchSize) {
    const batch = passportCSV.slice(i, i + batchSize);
    const addresses = batch.map((p: any) => ethers.utils.getAddress(p['Address']));
    const amounts = batch.map((p: any) => Number(p['Count']));
    await api.setup.live.passports(addresses, amounts);
    // console.log(addresses);
    // console.log(amounts);
  }
  const batch = passportCSV.slice(i, passportCSV.length);
  const addresses = batch.map((p: any) => ethers.utils.getAddress(p['Address']));
  const amounts = batch.map((p: any) => Number(p['Count']));
  await api.setup.live.passports(addresses, amounts);
  // console.log(addresses);
  // console.log(amounts);
}

async function initGachaWhitelist(api: AdminAPI) {
  const whitelistCSV = await readFile('snapshot/gacha_whitelist.csv');

  const batchSize = 75;
  let i = 0;
  for (i; i < whitelistCSV.length; i += batchSize) {
    const batch = whitelistCSV.slice(i, i + batchSize);
    const addresses = batch.map((w: any) => ethers.utils.getAddress(w['Address']));
    await api.setup.live.whitelists(addresses);
    // console.log(addresses);
  }
  const batch = whitelistCSV.slice(i, whitelistCSV.length);
  const addresses = batch.map((w: any) => ethers.utils.getAddress(w['Address']));
  await api.setup.live.whitelists(addresses);
  // console.log(addresses);
}
