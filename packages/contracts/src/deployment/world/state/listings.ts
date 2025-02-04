import { BigNumberish } from 'ethers';
import { AdminAPI } from '../api';
import { generateRegID, readFile } from './utils';

export async function initListings(api: AdminAPI, indices?: number[]) {
  const listingCSV = await readFile('listings/listings.csv');
  const pricingCSV = await readFile('listings/pricing.csv');
  const requirementCSV = await readFile('listings/requirements.csv');
  const setBuy = api.listing.set.price.buy;
  const setSell = api.listing.set.price.sell;

  for (let i = 0; i < listingCSV.length; i++) {
    const row = listingCSV[i];

    // skip if indices are overridden and row isn't included
    const itemIndex = Number(row['Item Index']);
    if (indices && !indices.includes(itemIndex)) continue;

    // Initial creation
    const npcIndex = Number(row['NPC Index']);
    const targetValue = Number(row['Value']);
    await createListing(api, npcIndex, itemIndex, targetValue);
    console.log(`created listing for npc ${npcIndex} of item ${itemIndex}`);

    // Set Buy Pricing
    const buyKey = String(row['Buy Key']);
    if (buyKey) {
      const price = pricingCSV.find((p: any) => p['Key'] === buyKey);
      if (price) {
        const type = String(price['Type']);
        if (type === 'FIXED') await setBuy.fixed(npcIndex, itemIndex);
        else if (type === 'GDA') {
          const scale = Math.round(Number(price['Scale']) * 1e9);
          const decay = Math.round(Number(price['Decay']) * 1e9);
          await setBuy.gda(npcIndex, itemIndex, scale, decay);
        }
        console.log(`  set buy price ${buyKey}`);
      } else console.warn(`  Buy Price not found for ref ${buyKey}`);
    }

    // Set Sell Pricing
    const sellKey = String(row['Sell Key']);
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
      } else console.warn(`  Sell Price not found for ref ${sellKey}`);
    }

    // Set Requirements
    // Assume if the key is found, the requirement exists
    const reqRefs = String(row['Requirements']).split(', ');
    for (let i = 0; i < reqRefs.length; i++) {
      if (!reqRefs[i]) continue;
      const key = reqRefs[i].split(' (')[0];
      const req = requirementCSV.find((r: any) => r['Name'] === key);
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

export async function createListing(
  api: AdminAPI,
  merchantIndex: number,
  itemIndex: number,
  value: number
) {
  await api.listing.create(merchantIndex, itemIndex, value);
}

export async function refreshListing(
  api: AdminAPI,
  npcIndex: number,
  itemIndex: number,
  value: number
) {
  console.log(`refreshing listing ${npcIndex}-${itemIndex} to ${value}`);
  await api.listing.refresh(npcIndex, itemIndex, value);
}

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
