// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { QueryFragment, QueryType } from "solecs/interfaces/Query.sol";
import { LibQuery } from "solecs/LibQuery.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

import { IdHolderComponent, ID as IdHolderCompID } from "components/IdHolderComponent.sol";
import { IndexGearComponent, ID as IndexGearCompID } from "components/IndexGearComponent.sol";
import { IndexItemComponent, ID as IndexItemCompID } from "components/IndexItemComponent.sol";
import { IndexModComponent, ID as IndexModCompID } from "components/IndexModComponent.sol";
import { IsEquippedComponent, ID as IsEquipCompID } from "components/IsEquippedComponent.sol";
import { IsInventoryComponent, ID as IsInvCompID } from "components/IsInventoryComponent.sol";
import { TypeComponent, ID as TypeCompID } from "components/TypeComponent.sol";
import { LibInventory } from "libraries/LibInventory.sol";
import { LibPet } from "libraries/LibPet.sol";
import { LibRegistryItem } from "libraries/LibRegistryItem.sol";
import { LibStat } from "libraries/LibStat.sol";

// handles the transition of equippable items to/from inventory/equipped
library LibEquipment {
  /////////////////
  // INTERACTIONS

  // equip an inventory entity to the holding entity. assume the item is equippable
  // @returns the entity ID of the equipped entity
  function equip(
    IWorld world,
    IUintComp components,
    uint256 petID,
    uint256 invID
  ) internal returns (uint256) {
    uint256 equipID;
    uint256 registryID = LibRegistryItem.getByInstance(components, invID);
    if (LibRegistryItem.isMod(components, registryID)) {
      equipID = equipMod(world, components, petID, invID);
    } else if (LibRegistryItem.isGear(components, registryID)) {
      equipID = equipGear(components, petID, invID);
    }
    require(equipID != 0, "LibEquipment.equip(): failed to equip");
    return equipID;
  }

  // Move Gear (non-fungible item) from inventory to equipped
  function equipGear(
    IUintComp components,
    uint256 petID,
    uint256 invID
  ) internal returns (uint256) {
    IsInventoryComponent(getAddressById(components, IsInvCompID)).remove(invID);
    IsEquippedComponent(getAddressById(components, IsEquipCompID)).set(invID);
    setHolder(components, invID, petID);

    // set the gear index and remove the item index
    uint256 registryID = LibRegistryItem.getByInstance(components, invID);
    uint256 gearIndex = LibRegistryItem.getGearIndex(components, registryID);
    setGearIndex(components, invID, gearIndex);
    removeItemIndex(components, invID);

    // set the type of the equipment entity
    string memory type_ = LibRegistryItem.getType(components, registryID);
    setType(components, invID, type_);
    return invID;
  }

  // Move a Mod (fungible item) from inventory to equipped. Assume there are enough slots.
  function equipMod(
    IWorld world,
    IUintComp components,
    uint256 petID,
    uint256 invID
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    IsEquippedComponent(getAddressById(components, IsEquipCompID)).set(id);
    setHolder(components, id, petID);

    // set the mod index
    uint256 registryID = LibRegistryItem.getByInstance(components, invID);
    uint256 modIndex = LibRegistryItem.getModIndex(components, registryID);
    IndexModComponent(getAddressById(components, IndexModCompID)).set(id, modIndex);

    // decrement the inventory balance
    LibInventory.dec(components, invID, 1);
    return id;
  }

  // Move an equipped Gear (non-fungible item) back to the player inventory
  function unequipGear(IUintComp components, uint256 id) internal returns (uint256) {
    IsEquippedComponent(getAddressById(components, IsEquipCompID)).remove(id);
    IsInventoryComponent(getAddressById(components, IsInvCompID)).set(id);
    TypeComponent(getAddressById(components, TypeCompID)).remove(id);

    // set the gear index and remove the item index
    uint256 registryID = LibRegistryItem.getByInstance(components, id);
    uint256 itemIndex = LibRegistryItem.getItemIndex(components, registryID);
    setItemIndex(components, id, itemIndex);
    removeGearIndex(components, id);

    // reassign this inventory to the player's inventory
    uint256 petID = getHolder(components, id);
    uint256 accountID = LibPet.getAccount(components, petID);
    setHolder(components, id, accountID);
    return id;
  }

  // Move an equipped Mod (fungible item) back to the player inventory. This deletes the entity.
  function unequipMod(IUintComp components, uint256 id) internal {
    // increment the player inventory balance
    uint256 petID = getHolder(components, id);
    uint256 accountID = LibPet.getAccount(components, petID);
    uint256 registryID = LibRegistryItem.getByInstance(components, id);
    uint256 itemIndex = LibRegistryItem.getItemIndex(components, registryID);
    uint256 invID = LibInventory.get(components, accountID, itemIndex);
    LibInventory.inc(components, invID, 1);

    // delete the equipped entity
    IsEquippedComponent(getAddressById(components, IsEquipCompID)).remove(id);
    removeHolder(components, id);
    removeModIndex(components, id);
  }

  /////////////////
  // CHECKERS

  // Check if the specified entity is an equipped Gear instance
  function isGear(IUintComp components, uint256 id) internal view returns (bool) {
    return
      IsEquippedComponent(getAddressById(components, IsEquipCompID)).has(id) &&
      IndexGearComponent(getAddressById(components, IndexGearCompID)).has(id);
  }

  // Check if the specified entity is an equipped Mod instance
  function isMod(IUintComp components, uint256 id) internal view returns (bool) {
    return
      IsEquippedComponent(getAddressById(components, IsEquipCompID)).has(id) &&
      IndexModComponent(getAddressById(components, IndexModCompID)).has(id);
  }

  /////////////////
  // SETTERS

  function setHolder(IUintComp components, uint256 id, uint256 holderID) internal {
    IdHolderComponent(getAddressById(components, IdHolderCompID)).set(id, holderID);
  }

  function setGearIndex(IUintComp components, uint256 id, uint256 gearIndex) internal {
    IndexGearComponent(getAddressById(components, IndexGearCompID)).set(id, gearIndex);
  }

  function setItemIndex(IUintComp components, uint256 id, uint256 itemIndex) internal {
    IndexItemComponent(getAddressById(components, IndexItemCompID)).set(id, itemIndex);
  }

  function setModIndex(IUintComp components, uint256 id, uint256 modIndex) internal {
    IndexModComponent(getAddressById(components, IndexModCompID)).set(id, modIndex);
  }

  // body-type restrictions for gear
  function setType(IUintComp components, uint256 id, string memory type_) internal {
    TypeComponent(getAddressById(components, TypeCompID)).set(id, type_);
  }

  /////////////////
  // REMOVERS

  function removeGearIndex(IUintComp components, uint256 id) internal {
    IndexGearComponent(getAddressById(components, IndexGearCompID)).remove(id);
  }

  function removeItemIndex(IUintComp components, uint256 id) internal {
    IndexItemComponent(getAddressById(components, IndexItemCompID)).remove(id);
  }

  function removeModIndex(IUintComp components, uint256 id) internal {
    IndexModComponent(getAddressById(components, IndexModCompID)).remove(id);
  }

  function removeHolder(IUintComp components, uint256 id) internal {
    IdHolderComponent(getAddressById(components, IdHolderCompID)).remove(id);
  }

  /////////////////
  // GETTERS

  function getHolder(IUintComp components, uint256 id) internal view returns (uint256) {
    return IdHolderComponent(getAddressById(components, IdHolderCompID)).getValue(id);
  }

  function getGearIndex(IUintComp components, uint256 id) internal view returns (uint256) {
    return IndexGearComponent(getAddressById(components, IndexGearCompID)).getValue(id);
  }

  function getItemIndex(IUintComp components, uint256 id) internal view returns (uint256) {
    return IndexItemComponent(getAddressById(components, IndexItemCompID)).getValue(id);
  }

  function getModIndex(IUintComp components, uint256 id) internal view returns (uint256) {
    return IndexModComponent(getAddressById(components, IndexModCompID)).getValue(id);
  }

  // Get the harmony of the equipped item. For fungible items we retrieve the stat from the
  // registry. For non-fungible items we retrieve the stat from the item itself.
  function getHarmony(IUintComp components, uint256 id) internal view returns (uint256 harmony) {
    if (isMod(components, id)) {
      uint256 registryID = LibRegistryItem.getByInstance(components, id);
      harmony = LibStat.getHarmony(components, registryID);
    } else if (isGear(components, id)) {
      harmony = LibStat.getHarmony(components, id);
    }
  }

  // Get the health of the equipped item. For fungible items we retrieve the stat from the
  // registry. For non-fungible items we retrieve the stat from the item itself.
  function getHealth(IUintComp components, uint256 id) internal view returns (uint256 health) {
    if (isMod(components, id)) {
      uint256 registryID = LibRegistryItem.getByInstance(components, id);
      health = LibStat.getPower(components, registryID);
    } else if (isGear(components, id)) {
      health = LibStat.getPower(components, id);
    }
  }

  // Get the power of the equipped item. For fungible items we retrieve the stat from the
  // registry. For non-fungible items we retrieve the stat from the item itself.
  function getPower(IUintComp components, uint256 id) internal view returns (uint256 power) {
    if (isMod(components, id)) {
      uint256 registryID = LibRegistryItem.getByInstance(components, id);
      power = LibStat.getPower(components, registryID);
    } else if (isGear(components, id)) {
      power = LibStat.getPower(components, id);
    }
  }

  // Get the violence of the equipped item. For fungible items we retrieve the stat from the
  // registry. For non-fungible items we retrieve the stat from the item itself.
  function getViolence(IUintComp components, uint256 id) internal view returns (uint256 violence) {
    if (isMod(components, id)) {
      uint256 registryID = LibRegistryItem.getByInstance(components, id);
      violence = LibStat.getViolence(components, registryID);
    } else if (isGear(components, id)) {
      violence = LibStat.getViolence(components, id);
    }
  }
}
