import {
  EntityIndex,
  EntityID,
  Has,
  HasValue,
  getComponentValue,
  runQuery,
} from '@latticexyz/recs';

import { Layers } from 'src/types';
import { Kami, getKami } from './Kami';
import {
  Inventory,
  getInventory,
  sortInventories
} from './Inventory';

// standardized shape of an Account Entity
export interface Account {
  id: EntityID;
  ownerEOA: string;
  operatorEOA: string;
  name: string;
  coin: number;
  location: number;
  stamina: number;
  staminaCurrent: number;
  inventories?: AccountInventories;
  lastBlock: number;
  lastMoveTs: number;
  kamis?: Kami[];
}

export interface AccountOptions {
  kamis?: boolean;
  inventory?: boolean;
}

// bucketed inventory slots
interface AccountInventories {
  food: Inventory[];
  revives: Inventory[];
  gear: Inventory[];
  mods: Inventory[];
}

// get an Account from its EnityIndex
export const getAccount = (
  layers: Layers,
  index: EntityIndex,
  options?: AccountOptions
): Account => {
  const {
    network: {
      world,
      components: {
        Coin,
        HolderID,
        IsInventory,
        LastBlock,
        LastTime,
        Location,
        Name,
        OperatorAddress,
        OwnerAddress,
        Stamina,
        StaminaCurrent
      },
    },
  } = layers;

  let account: Account = {
    id: world.entities[index],
    ownerEOA: getComponentValue(OwnerAddress, index)?.value as string,
    operatorEOA: getComponentValue(OperatorAddress, index)?.value as string,
    name: getComponentValue(Name, index)?.value as string,
    coin: getComponentValue(Coin, index)?.value as number,
    location: getComponentValue(Location, index)?.value as number,
    stamina: getComponentValue(Stamina, index)?.value as number,
    staminaCurrent: getComponentValue(StaminaCurrent, index)?.value as number,
    lastBlock: getComponentValue(LastBlock, index)?.value as number,
    lastMoveTs: getComponentValue(LastTime, index)?.value as number,
  };


  /////////////////
  // OPTIONAL DATA
  if (options?.inventory) {
    const inventoryResults = Array.from(
      runQuery([
        Has(IsInventory),
        HasValue(HolderID, { value: account.id })
      ])
    );

    // food inventories
    let inventory: Inventory;
    let inventories: AccountInventories = {
      food: [],
      revives: [],
      gear: [],
      mods: [],
    };
    for (let i = 0; i < inventoryResults.length; i++) {
      inventory = getInventory(layers, inventoryResults[i]);
      if (inventory.item.type === 'FOOD') inventories.food.push(inventory);
      if (inventory.item.type === 'REVIVE') inventories.revives.push(inventory);
      if (inventory.item.type === 'GEAR') inventories.gear.push(inventory);
      if (inventory.item.type === 'MOD') inventories.mods.push(inventory);
    }

    sortInventories(inventories.food);
    sortInventories(inventories.revives);
    sortInventories(inventories.gear);
    sortInventories(inventories.mods);
    account.inventories = inventories;
  }


  // populate Kamis
  // NOTE: we can't rely on this function. oddly, there's an eager return of the object
  // prior to the kamis field being set. spreading the {...account, kamis} doesn't work.
  // neither does returning within this if-block or setting the kamis array explicitly
  // attempting to set the whole object at once also fails. suspecting it has something
  // to do with how runQuery operates.
  // if (options.kamis) {
  //   const kamiIndices = Array.from(
  //     runQuery([Has(IsPet), HasValue(AccountID, { value: account.id })])
  //   );

  //   account.kamis = kamiIndices.map(
  //     (index): Kami => getKami(layers, index, { production: true, stats: true })
  //   );

  //   // // like wtf man.. leaving this here so everyone can witness the absurdity
  //   // // thanks, enjoyed witnessing this absurdity
  //   // let kami: Kami;
  //   // let kamis: Kami[] = [];
  //   // for (let i = 0; i < account.kamis.length; i++) {
  //   //   kami = getKami(layers, index, { production: true, stats: true });
  //   //   kamis.push(kami);
  //   // }
  //   // console.log('getAccount(): kamis', kamis);
  //   // account.kamis = kamis;
  //   // console.log('getAccount(): account', account);
  // }
  return account;
};