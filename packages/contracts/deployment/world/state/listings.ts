import { BigNumberish } from 'ethers';
import { AdminAPI } from '../api';
import { generateRegID, getSheet, readFile } from './utils';

// TODO: trigger more verbose console logs (e.g. item/npc names) and only on a verbose flag
export async function initListings(api: AdminAPI, indices?: number[], local?: boolean) {
  const listingCSV = await getSheet('listings', 'listings');
  if (!listingCSV) return console.log('No listings/listings.csv found');
  const pricingCSV = await getSheet('listings', 'pricing');
  if (!pricingCSV) return console.log('No listings/pricing.csv found');
  const requirementCSV = await getSheet('listings', 'requirements');
  if (!requirementCSV) return console.log('No listings/requirements.csv found');
  console.log('\n==INITIALIZING LISTINGS==');

  const setBuy = api.listing.set.price.buy;
  const setSell = api.listing.set.price.sell;

  const validStatuses = ['In-game'];
  if (local) validStatuses.push('Local');

  for (let i = 0; i < listingCSV.length; i++) {
    const row = listingCSV[i];

    // skip if indices are overridden and row isn't included
    const itemIndex = Number(row['Item Index']);
    if (indices && !indices.includes(itemIndex)) continue;

    const status = String(row['Status']);
    if (!validStatuses.includes(status)) continue;

    // Initial creation
    const npcIndex = Number(row['NPC Index']);
    const targetValue = Number(row['Value']);
    const currency = Number(row['Currency Index']);

    await createListing(api, npcIndex, itemIndex, currency, targetValue);
    console.log(`Creating Listing: for npc ${npcIndex} of item ${itemIndex} for ${targetValue}`);

    // Set Buy Pricing
    const buyKey = String(row['Buy Price']);
    if (buyKey) {
      const price = pricingCSV.find((p: any) => p['Key'] === buyKey);
      if (price) {
        const type = String(price['Type']);
        if (type === 'FIXED') await setBuy.fixed(npcIndex, itemIndex);
        else if (type === 'GDA') {
          const period = Number(price['Period']);
          const decay = Math.round(Number(price['Decay']) * 1e6);
          const rate = Number(price['Rate']);
          await setBuy.gda(npcIndex, itemIndex, period, decay, rate, false);
        }
        console.log(`  set buy price ${buyKey}`);
      } else console.log(`  Buy Price not found for ref ${buyKey}`);
    }

    // Set Sell Pricing
    const sellKey = String(row['Sell Price']);
    if (sellKey) {
      const price = pricingCSV.find((p: any) => p['Key'] === sellKey);
      if (price) {
        const type = String(price['Type']);
        if (type === 'FIXED') await setSell.fixed(npcIndex, itemIndex);
        else if (type === 'SCALED') {
          const scale = Math.round(Number(price['Scale']) * 1e9);
          await setSell.scaled(npcIndex, itemIndex, scale);
        }
        console.log(`  set sell price ${sellKey}`);
      } else console.log(`  Sell Price not found for ref ${sellKey}`);
    }

    // Set Requirements
    // Assume if the key is found, the requirement exists
    const reqRefs = String(row['Requirements']).split(',');
    for (let i = 0; i < reqRefs.length; i++) {
      if (!reqRefs[i]) continue;
      const key = reqRefs[i];
      const req = requirementCSV.find((r: any) => r['Key'] === key);
      const reqType = String(req['Type']);
      const reqLogic = String(req['Logic']);
      const reqIndex = Number(req['Index'] ?? 0);

      // determine the value
      let reqValue: BigNumberish;
      const reqValueRaw = req['Value'];
      if (reqValueRaw) reqValue = Number(reqValueRaw);
      else {
        const reqValueField = String(req['ValueField']);
        const reqValueIndex = Number(req['ValueIndex']);
        reqValue = generateRegID(reqValueField, reqValueIndex);
      }

      const setRequirement = api.listing.set.requirement;
      setRequirement(npcIndex, itemIndex, reqType, reqLogic, reqIndex, reqValue, '');
      console.log(`  set requirement ${key}`);
      console.log(`    type: ${reqType}, logic: ${reqLogic}`);
      console.log(`    index: ${reqIndex}, value: ${reqValue}`);
    }
  }
}

// indices = item index. todo: upgrade to multiple merchants
export async function deleteListings(api: AdminAPI, indices: number[]) {
  // assume NPC index = 1 (mina)
  for (let i = 0; i < indices.length; i++) {
    try {
      await api.listing.remove(1, indices[i]);
    } catch {
      console.error('Could not delete listing ' + indices[i]);
    }
  }
}

// indices = item index
// WARNING: this will reset GDA prices
export async function reviseListings(api: AdminAPI, overrideIndices?: number[]) {
  let indices: number[] = [];
  if (overrideIndices) indices = overrideIndices;
  else {
    const listingsCSV = await readFile('listings/listings.csv');
    for (let i = 0; i < listingsCSV.length; i++) {
      // revise all, using item index
      indices.push(Number(listingsCSV[i]['Item Index']));
    }
  }

  await deleteListings(api, indices);
  await initListings(api, indices);
}

export async function createListing(
  api: AdminAPI,
  merchantIndex: number,
  itemIndex: number,
  currencyIndex: number,
  value: number
) {
  await api.listing.create(merchantIndex, itemIndex, currencyIndex, value);
}

// // to test ERC20 listings; sells a brick for 1 ONYX (18dp)
// export async function initLocalListings(api: AdminAPI) {
//   await api.listing.create(1, 1001, 100, parseEther('0.05')); // 0.05 onyx
//   await api.listing.set.price.buy.fixed(1, 1001); // hardcoded onyx index = 11
//   await api.listing.create(1, 1002, 100, parseEther('1')); // 1 onyx
//   await api.listing.set.price.buy.fixed(1, 1002); // hardcoded onyx index = 11
// }

export const setRequirement = async (
  api: AdminAPI,
  npcIndex: number,
  itemIndex: number,
  conditionType: string,
  logicType: string,
  index: number,
  value: BigNumberish
) => {
  await api.listing.set.requirement(
    npcIndex,
    itemIndex,
    conditionType,
    logicType,
    index,
    value,
    ''
  );
};
