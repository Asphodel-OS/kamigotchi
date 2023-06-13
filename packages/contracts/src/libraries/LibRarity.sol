// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { RarityComponent, ID as RarityCompID } from "components/RarityComponent.sol";

library LibRarity {
  // check if a registry entity has a rarity tier
  function hasTier(IUintComp components, uint256 registryID) internal view returns (bool) {
    return RarityComponent(getAddressById(components, RarityCompID)).has(registryID);
  }

  // get the rarity tier of a registry entity if it exists, otherwise return 0
  function getTier(
    IUintComp components,
    uint256 registryID
  ) internal view returns (uint256 rarity) {
    if (hasTier(components, registryID))
      rarity = RarityComponent(getAddressById(components, RarityCompID)).getValue(registryID);
  }

  // get the selection weights of a list of registry entities based on their rarity tier
  // weights to 0 for any registry entities without a rarity tier
  function getWeights(
    IUintComp components,
    uint256[] memory registryIDs
  ) internal view returns (uint256[] memory rarities) {
    rarities = new uint256[](registryIDs.length);

    uint256 tier;
    for (uint256 i; i < registryIDs.length; i++) {
      tier = getTier(components, registryIDs[i]);
      if (tier > 0) rarities[i] = 3 ** (tier - 1);
    }
  }

  // generates a key pair array from an array of registry entity IDs
  // @param registryIDs the entity IDs of the registry entries being queried
  // @param indexComponentID the component ID of the index component referenced as the key
  function getRarityKeyValueArr(
    IUintComp components,
    uint256[] memory registryIDs,
    uint256 indexComponentID
  ) internal view returns (uint256[] memory keys, uint256[] memory rarities) {
    keys = new uint256[](registryIDs.length);
    rarities = new uint256[](registryIDs.length);
    for (uint256 i; i < registryIDs.length; i++) {
      IUintComp rComp = IUintComp(getAddressById(components, RarityCompID));
      if (rComp.has(registryIDs[i])) {
        rarities[i] = rComp.getValue(registryIDs[i]);
      } else {
        rarities[i] = 0;
      }
      keys[i] = IUintComp(getAddressById(components, indexComponentID)).getValue(registryIDs[i]);
    }
  }
}
