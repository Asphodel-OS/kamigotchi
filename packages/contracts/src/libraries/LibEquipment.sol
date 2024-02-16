// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { QueryFragment, QueryType } from "solecs/interfaces/Query.sol";
import { LibQuery } from "solecs/LibQuery.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

import { IdHolderComponent, ID as IdHolderCompID } from "components/IdHolderComponent.sol";
import { IndexItemComponent, ID as IndexItemCompID } from "components/IndexItemComponent.sol";
import { IsEquippedComponent, ID as IsEquipCompID } from "components/IsEquippedComponent.sol";
import { IsFungibleComponent, ID as IsFungibleCompID } from "components/IsFungibleComponent.sol";
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
    if (LibRegistryItem.isFungible(components, registryID)) {
      equipID = equipFungible(world, components, petID, invID);
    } else {
      equipID = equipNonfungible(components, petID, invID);
    }
    require(equipID != 0, "LibEquipment.equip(): failed to equip");
    return equipID;
  }

  // Move a non-fungible item from inventory to equipped
  function equipNonfungible(
    IUintComp components,
    uint256 petID,
    uint256 invID
  ) internal returns (uint256) {
    unsetIsInventory(components, invID);
    setIsEquipped(components, invID);

    // set the slot type of equipment entity
    uint256 registryID = LibRegistryItem.getByInstance(components, invID);
    string memory type_ = LibRegistryItem.getType(components, registryID);
    setType(components, invID, type_);
    return invID;
  }

  // Move a fungible item from inventory to equipped. Assume there are enough slots.
  function equipFungible(
    IWorld world,
    IUintComp components,
    uint256 petID,
    uint256 invID
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    setIsEquipped(components, id);
    setIsFungible(components, id);
    setHolder(components, id, petID);
    setItemIndex(components, id, getItemIndex(components, invID));
    LibInventory.dec(components, invID, 1);
    return id;
  }

  // Move an equipped non-fungible item back to the player inventory
  function unequipNonfungible(IUintComp components, uint256 id) internal returns (uint256) {
    setIsInventory(components, id);
    unsetIsEquipped(components, id);
    unsetType(components, id); // maybe could be set to an inventory category in the future
    return id;
  }

  // Move an equipped fungible item back to the player inventory. This deletes the entity.
  // NOTE: this function can break if no inventory instance exists. we must be able to
  // guarantee a path through nonperishing inventory before an item is equipped.
  function unequipFungible(IUintComp components, uint256 id) internal {
    // increment the player inventory balance
    uint256 petID = getHolder(components, id);
    uint256 accountID = LibPet.getAccount(components, petID);
    uint256 invID = LibInventory.get(components, accountID, getItemIndex(components, id));
    LibInventory.inc(components, invID, 1);

    // delete the equipped entity
    unsetIsEquipped(components, id);
    unsetItemIndex(components, id);
    unsetHolder(components, id);
  }

  /////////////////
  // CHECKERS

  function isEquipped(IUintComp components, uint256 id) internal view returns (bool) {
    return IsEquippedComponent(getAddressById(components, IsEquipCompID)).has(id);
  }

  // Check if the specified entity is an equipped Mod instance
  function isFungible(IUintComp components, uint256 id) internal view returns (bool) {
    return IsFungibleComponent(getAddressById(components, IsFungibleCompID)).has(id);
  }

  function IsInventory(IUintComp components, uint256 id) internal view returns (bool) {
    return IsInventoryComponent(getAddressById(components, IsInvCompID)).has(id);
  }

  /////////////////
  // SETTERS

  function setHolder(IUintComp components, uint256 id, uint256 holderID) internal {
    IdHolderComponent(getAddressById(components, IdHolderCompID)).set(id, holderID);
  }

  function setIsEquipped(IUintComp components, uint256 id) internal {
    IsEquippedComponent(getAddressById(components, IsEquipCompID)).set(id);
  }

  function setIsFungible(IUintComp components, uint256 id) internal {
    IsFungibleComponent(getAddressById(components, IsFungibleCompID)).set(id);
  }

  function setIsInventory(IUintComp components, uint256 id) internal {
    IsInventoryComponent(getAddressById(components, IsInvCompID)).set(id);
  }

  function setItemIndex(IUintComp components, uint256 id, uint32 itemIndex) internal {
    IndexItemComponent(getAddressById(components, IndexItemCompID)).set(id, itemIndex);
  }

  // body slot category for postiional equipment
  function setType(IUintComp components, uint256 id, string memory type_) internal {
    TypeComponent(getAddressById(components, TypeCompID)).set(id, type_);
  }

  /////////////////
  // REMOVERS

  function unsetHolder(IUintComp components, uint256 id) internal {
    IdHolderComponent(getAddressById(components, IdHolderCompID)).remove(id);
  }

  function unsetIsEquipped(IUintComp components, uint256 id) internal {
    IsEquippedComponent(getAddressById(components, IsEquipCompID)).remove(id);
  }

  function unsetIsInventory(IUintComp components, uint256 id) internal {
    IsInventoryComponent(getAddressById(components, IsInvCompID)).remove(id);
  }

  function unsetItemIndex(IUintComp components, uint256 id) internal {
    IndexItemComponent(getAddressById(components, IndexItemCompID)).remove(id);
  }

  function unsetType(IUintComp components, uint256 id) internal {
    TypeComponent(getAddressById(components, TypeCompID)).remove(id);
  }

  /////////////////
  // GETTERS

  function getHolder(IUintComp components, uint256 id) internal view returns (uint256) {
    return IdHolderComponent(getAddressById(components, IdHolderCompID)).getValue(id);
  }

  function getItemIndex(IUintComp components, uint256 id) internal view returns (uint32) {
    return IndexItemComponent(getAddressById(components, IndexItemCompID)).getValue(id);
  }

  function getType(IUintComp components, uint256 id) internal view returns (string memory) {
    return TypeComponent(getAddressById(components, TypeCompID)).getValue(id);
  }

  // Get the harmony of the equipped item. For fungible items we retrieve the stat from the
  // registry. For non-fungible items we retrieve the stat from the item itself.
  function getHarmony(IUintComp components, uint256 id) internal view returns (int32) {
    if (isFungible(components, id)) {
      uint256 registryID = LibRegistryItem.getByInstance(components, id);
      return LibStat.getHarmonyTotal(components, registryID);
    }
    return LibStat.getHarmonyTotal(components, id);
  }

  // Get the health of the equipped item. For fungible items we retrieve the stat from the
  // registry. For non-fungible items we retrieve the stat from the item itself.
  function getHealth(IUintComp components, uint256 id) internal view returns (int32) {
    if (isFungible(components, id)) {
      uint256 registryID = LibRegistryItem.getByInstance(components, id);
      return LibStat.getPowerTotal(components, registryID);
    }
    return LibStat.getPowerTotal(components, id);
  }

  // Get the power of the equipped item. For fungible items we retrieve the stat from the
  // registry. For non-fungible items we retrieve the stat from the item itself.
  function getPower(IUintComp components, uint256 id) internal view returns (int32) {
    if (isFungible(components, id)) {
      uint256 registryID = LibRegistryItem.getByInstance(components, id);
      return LibStat.getPowerTotal(components, registryID);
    }
    return LibStat.getPowerTotal(components, id);
  }

  // Get the violence of the equipped item. For fungible items we retrieve the stat from the
  // registry. For non-fungible items we retrieve the stat from the item itself.
  function getViolence(IUintComp components, uint256 id) internal view returns (int32) {
    if (isFungible(components, id)) {
      uint256 registryID = LibRegistryItem.getByInstance(components, id);
      return LibStat.getViolenceTotal(components, registryID);
    }
    return LibStat.getViolenceTotal(components, id);
  }

  /////////////////
  // QUERIES

  // Get all items equipped to a Pet Entity.
  function getForPet(IUintComp components, uint256 petID) internal view returns (uint256[] memory) {
    return _getAllX(components, petID, "");
  }

  // Get all instances of Equipped items as specified. Blank filters are not applied.
  function _getAllX(
    IUintComp components,
    uint256 holderID,
    string memory type_ // gear type
  ) internal view returns (uint256[] memory) {
    uint256 setFilters; // number of optional non-zero filters
    if (holderID != 0) setFilters++;
    if (!LibString.eq(type_, "")) setFilters++;

    uint256 filterCount = 1; // start with the number of mandatory filters
    QueryFragment[] memory fragments = new QueryFragment[](setFilters + filterCount);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsEquipCompID), "");

    if (holderID != 0) {
      fragments[filterCount++] = QueryFragment(
        QueryType.HasValue,
        getComponentById(components, IdHolderCompID),
        abi.encode(holderID)
      );
    }
    if (!LibString.eq(type_, "")) {
      fragments[filterCount++] = QueryFragment(
        QueryType.HasValue,
        getComponentById(components, TypeCompID),
        abi.encode(type_)
      );
    }

    return LibQuery.query(fragments);
  }
}
