// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { getAddressById, getComponentById, addressToEntity } from "solecs/utils.sol";

import { HealthComponent, ID as HealthCompID } from "components/HealthComponent.sol";
import { ExperienceComponent, ID as ExpCompID } from "components/ExperienceComponent.sol";
import { LevelComponent, ID as LevelCompID } from "components/LevelComponent.sol";

import { LibExperience } from "libraries/LibExperience.sol";
import { LibInventory } from "libraries/LibInventory.sol";
import { LibPet } from "libraries/LibPet.sol";
import { LibRegistryItem } from "libraries/LibRegistryItem.sol";

// This library is a wrapper that provides useful functions around the food items

library LibFood {
  /////////////////
  // INTERACTIONS

  /// @notice executes the feeding action based on the food item.
  /// @dev does not decrement or check for inventory balance
  function feed(IUintComp components, uint256 targetID, uint256 index) internal {
    uint256 registryID = getFoodByIndex(components, index);

    // run feeding actions
    incHealth(components, registryID, targetID);
    incExperience(components, registryID, targetID);
  }

  /// @dev decrement has an implicit check for insufficient balance
  function decInv(IUintComp components, uint256 accountID, uint256 index) internal {
    uint256 inventoryID = LibInventory.get(components, accountID, index);
    LibInventory.dec(components, inventoryID, 1);
  }

  function incHealth(IUintComp components, uint256 regID, uint256 targetID) internal {
    uint256 amt = getHealth(components, regID);
    if (amt > 0) LibPet.heal(components, targetID, amt);
  }

  function incExperience(IUintComp components, uint256 regID, uint256 targetID) internal {
    uint256 amt = getExperience(components, regID);
    if (amt > 0) LibExperience.inc(components, targetID, amt);
  }

  /////////////////
  // GETTERS

  function getHealth(IUintComp components, uint256 id) internal returns (uint256) {
    HealthComponent comp = HealthComponent(getAddressById(components, HealthCompID));
    if (comp.has(id)) return comp.getValue(id);
    else return 0;
  }

  function getExperience(IUintComp components, uint256 id) internal returns (uint256) {
    ExperienceComponent comp = ExperienceComponent(getAddressById(components, ExpCompID));
    if (comp.has(id)) return comp.getValue(id);
    else return 0;
  }

  ////////////////
  // QUERIES

  function getFoodByIndex(IUintComp components, uint256 index) internal view returns (uint256) {
    // return LibRegistryItem.getByItemIndex(components, index);
    return LibRegistryItem.getByFoodIndex(components, index);
  }
}
