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

// standardized shape of an Account Entity
export interface Account {
  id: EntityID;
  ownerEOA: string;
  operatorEOA: string;
  name: string;
  coin: number;
  location: number;
  kamis?: Kami[];
}

export interface AccountOptions {
  kamis?: boolean;
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
        AccountID,
        IsPet,
        Coin,
        Location,
        Name,
        OperatorAddress,
        OwnerID,
      },
    },
  } = layers;

  let account: Account = {
    id: world.entities[index],
    ownerEOA: getComponentValue(OwnerID, index)?.value as string,
    operatorEOA: getComponentValue(OperatorAddress, index)?.value as string,
    name: getComponentValue(Name, index)?.value as string,
    coin: getComponentValue(Coin, index)?.value as number,
    location: getComponentValue(Location, index)?.value as number,
  };

  /////////////////
  // OPTIONAL DATA


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