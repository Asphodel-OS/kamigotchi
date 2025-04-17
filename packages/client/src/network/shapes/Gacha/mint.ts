import { EntityID, World } from '@mud-classic/recs';

import { Components } from 'network/components';
import { getData } from '../Data';

type MintData = {
  whitelist: number;
  public: number;
  total: number;
};

// get the mint data of an Entity by its ID
export const getMintData = (
  world: World,
  components: Components,
  accountID: EntityID
): MintData => {
  return {
    whitelist: getData(world, components, accountID, 'MINT_NUM_WL'),
    public: getData(world, components, accountID, 'MINT_NUM_PUBLIC'),
    total: getData(world, components, accountID, 'MINT_NUM_TOTAL'),
  };
};
