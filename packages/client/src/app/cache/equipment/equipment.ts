import { EntityID, World, getComponentValue } from 'engine/recs';
import { solidityPackedKeccak256 } from 'ethers';

import { formatEntityID } from 'engine/utils';
import { Components } from 'network/';
import { getBonusValue } from 'network/shapes/Bonus';
import { Inventory } from 'network/shapes/Inventory';
import { getItemByIndex } from 'network/shapes/Item';

const EQUIPMENT_SLOTS = [
  'Head_Slot',
  'Body_Slot',
  'Hands_Slot',
  'Passport_slot',
  'Kami_Pet_Slot',
] as const;

// equipment instance
export function genEquipmentID(holderID: EntityID, slot: string): EntityID {
  const hash = solidityPackedKeccak256(
    ['string', 'uint256', 'string'],
    ['equipment.instance', BigInt(holderID), slot]
  );
  return formatEntityID(hash);
}

// returns all equipped items for a kami
export function getEquipped(
  world: World,
  components: Components,
  kamiID: EntityID
): Record<string, Inventory | null> {
  const { OwnsEquipID, ItemIndex } = components;
  const result: Record<string, Inventory | null> = {};

  for (const slot of EQUIPMENT_SLOTS) {
    result[slot] = null;

    const equipID = genEquipmentID(kamiID, slot);
    const equipEntity = world.entityToIndex.get(equipID);
    if (equipEntity === undefined) continue;

    const ownerID = getComponentValue(OwnsEquipID, equipEntity)?.value;
    if (ownerID !== kamiID) continue;

    const itemIndex = getComponentValue(ItemIndex, equipEntity)?.value as number;
    if (!itemIndex) continue;

    const item = getItemByIndex(world, components, itemIndex);
    result[slot] = {
      id: equipID,
      entity: equipEntity,
      item,
      balance: 1,
    };
  }

  return result;
}

export function getEquipmentCapacity(
  world: World,
  components: Components,
  kamiID: EntityID
): number {
  const bonus = getBonusValue(world, components, 'EQUIP_CAPACITY_SHIFT', kamiID);
  return Math.max(1, 1 + bonus);
}
