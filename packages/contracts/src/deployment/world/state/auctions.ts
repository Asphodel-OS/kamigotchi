import { AdminAPI } from '../api';
import { readFile } from './utils';

export async function initAuctions(api: AdminAPI, indices?: number[]) {
  const auctionsCSV = await readFile('auctions/auctions.csv');
  // skip requirements for now
  // const requirementsCSV = await readFile('auctions/requirements.csv');

  for (let i = 0; i < auctionsCSV.length; i++) {
    const row = auctionsCSV[i];

    const itemIndex = Number(row['Sale Index']);
    if (indices && !indices.includes(itemIndex)) continue;

    const payItemIndex = Number(row['Pay Index']);
    const priceTarget = Number(row['Value']);
    const period = Number(row['Period']);
    const decay = Number(row['Decay']);
    const rate = Number(row['Rate']);
    const max = Number(row['Supply']);

    await createAuction(api, itemIndex, payItemIndex, priceTarget, period, decay, rate, max);
    console.log(`created auction for item ${itemIndex} for item ${payItemIndex} with ${max} units`);
  }
}

export async function createAuction(
  api: AdminAPI,
  itemIndex: number,
  payItemIndex: number,
  priceTarget: number,
  period: number,
  decay: number,
  rate: number,
  max: number
) {
  await api.auction.create(itemIndex, payItemIndex, priceTarget, period, decay, rate, max);
}

export async function deleteAuctions(api: AdminAPI, indices: number[]) {
  for (let i = 0; i < indices.length; i++) {
    try {
      await api.auction.remove(indices[i]);
    } catch {
      console.error('Could not delete auction ' + indices[i]);
    }
  }
}

export async function setRequirement(
  api: AdminAPI,
  auctionIndex: number,
  type_: string,
  logicType: string,
  index: number,
  value: number,
  for_: string
) {
  await api.auction.set.requirement(auctionIndex, type_, logicType, index, value, for_);
}
