import { AdminAPI } from '../api';
import { getSheet } from './utils';

// create an auction
export async function createAuction(api: AdminAPI, row: any) {
  const index = Number(row['Sale Index']);
  const payItemIndex = Number(row['Pay Index']);
  const priceTarget = Number(row['Value']);
  const period = Number(row['Period']);
  const decay = Math.round(Number(row['Decay']) * 1e6);
  const rate = Number(row['Rate']);
  const max = Number(row['Supply']);
  const startTs = Number(row['Start Epoch']);
  try {
    console.log(`Creating Auction: item ${index} with ${max} units`);
    await api.auction.create(index, payItemIndex, priceTarget, period, decay, rate, max, startTs);
  } catch (e) {
    console.log(`Error: Could not create auction`);
    console.log(`  for ${priceTarget} item ${payItemIndex} decaying at ${decay / 1e6}`);
    console.log(`  and emitting up to ${max} at ${rate} units per ${period / 3600} hours`);
  }
}

/////////////////
// SCRIPTS

// TODO: support statuses
export async function initAuctions(api: AdminAPI, indices?: number[]) {
  const csv = await getSheet('auctions', 'auctions');
  if (!csv) return console.log('No auctions/auctions.csv found');
  console.log('\n==INITIALIZING AUCTIONS==');

  for (let i = 0; i < csv.length; i++) {
    const row = csv[i];

    const index = Number(row['Sale Index']);
    if (indices && !indices.includes(index)) continue;

    await createAuction(api, row);
  }
}

// delete the specified auctions
export async function deleteAuctions(api: AdminAPI, indices: number[]) {
  for (let i = 0; i < indices.length; i++) {
    const itemIndex = indices[i];
    console.log(`Deleting auction for item index ${itemIndex}`);
    try {
      await api.auction.remove(itemIndex);
    } catch {
      console.error(`  Could not delete auction ${itemIndex}`);
    }
  }
}

export async function reviseAuctions(api: AdminAPI, indices: number[]) {
  await deleteAuctions(api, indices);
  await initAuctions(api, indices);
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
