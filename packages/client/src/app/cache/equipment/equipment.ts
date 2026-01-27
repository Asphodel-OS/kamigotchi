import { EntityID, World, getComponentValue } from 'engine/recs';
import { solidityPackedKeccak256 } from 'ethers';

import { formatEntityID } from 'engine/utils';
import { Components } from 'network/';
import { Inventory } from 'network/shapes/Inventory';
import { getItemByIndex } from 'network/shapes/Item';

const EQUIPMENT_SLOTS = [
  'Kami_Head_Slot',
  'Kami_Body_Slot',
  'Kami_Hands_Slot',
  'Kami_Passport_Slot',
  'Kami_Pet_Slot',
] as const;

// equipment instance
export function genEquipmentID(holderID: EntityID, slot: string): EntityID {
  const holderBigInt = BigInt(holderID);
  const hash = solidityPackedKeccak256(
    ['string', 'uint256', 'string'],
    ['equipment.instance', holderBigInt, slot]
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
