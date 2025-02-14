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
    const decay = Math.round(Number(row['Decay']) * 1e6);
    const rate = Number(row['Rate']);
    const max = Number(row['Supply']);

    const saleItemName = String(row['Sale Item']).split(' (')[0];
    const payItemName = String(row['Pay Item']).split(' (')[0];
    await createAuction(api, itemIndex, payItemIndex, priceTarget, period, decay, rate, max);
    console.log(
      `created auction: ${saleItemName} for ${priceTarget} ${payItemName} with ${max} units`,
      `\n  decay ${decay / 1e6} and rate ${rate} per ${period / 3600} hours`
    );
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
    const itemIndex = indices[i];
    console.log(`  Deleting auction for item index ${itemIndex}`);
    try {
      await api.auction.remove(itemIndex);
    } catch {
      console.error(`  Could not delete auction ${itemIndex}`);
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
