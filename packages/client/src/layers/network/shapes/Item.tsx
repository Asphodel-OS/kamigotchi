import {
  EntityID,
  EntityIndex,
  Has,
  HasValue,
  getComponentValue,
  hasComponent,
  runQuery,
} from '@latticexyz/recs';

import { NetworkLayer } from 'layers/network/types';
import { baseURI } from 'src/constants/media';
import { Stats, getStats } from './Stats';

// The standard shape of a FE Item Entity
export interface Item {
  id: EntityID;
  entityIndex: EntityIndex;
  index: number;
  is: {
    consumable: boolean;
    fungible: boolean;
    lootbox: boolean;
  };
  type: string;
  image: {
    default: string;
    x4: string;
  };
  name: string;
  description: string;
  stats?: Stats;
}

/**
 * Gets info about an item from an SC item registry
 * Supplements additional data for FE consumption if available
 */
export const getItem = (
  network: NetworkLayer,
  entityIndex: EntityIndex // entity index of the registry instance
): Item => {
  const {
    world,
    components: {
      Description,
      ItemIndex,
      IsConsumable,
      IsFungible,
      IsLootbox,
      MediaURI,
      Name,
      Type,
    },
  } = network;

  let Item: Item = {
    entityIndex,
    id: world.entities[entityIndex],
    index: getComponentValue(ItemIndex, entityIndex)?.value as number,
    type: getComponentValue(Type, entityIndex)?.value as string,
    name: (getComponentValue(Name, entityIndex)?.value as string) ?? 'Unknown Item',
    description: getComponentValue(Description, entityIndex)?.value as string,
    image: {
      default: `${baseURI}${getComponentValue(MediaURI, entityIndex)?.value as string}`,
      x4: `${baseURI}${(getComponentValue(MediaURI, entityIndex)?.value as string).slice(
        0,
        -4
      )}_x4.png`,
    },
    stats: getStats(network, entityIndex),
    is: {
      consumable: hasComponent(IsConsumable, entityIndex),
      fungible: hasComponent(IsFungible, entityIndex),
      lootbox: hasComponent(IsLootbox, entityIndex),
    },
  };
  if (hasComponent(IsLootbox, entityIndex)) Item.type = 'LOOTBOX';

  return Item;
};

// get an item in the registry by index
export const getItemByIndex = (
  network: NetworkLayer,
  index: number // item index of the registry instance
): Item => {
  const {
    components: { IsRegistry, ItemIndex },
  } = network;

  const entityIndices = Array.from(
    runQuery([Has(IsRegistry), HasValue(ItemIndex, { value: index })])
  );
  return getItem(network, entityIndices[0]);
};

// get all items in the registry
export const getAllItems = (network: NetworkLayer): Item[] => {
  const {
    components: { IsRegistry, ItemIndex },
  } = network;

  const entityIndices = Array.from(runQuery([Has(IsRegistry), Has(ItemIndex)]));
  return entityIndices.map((entityIndex) => getItem(network, entityIndex));
};
