// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

import { RarityComponent, ID as RarityCompID } from "components/RarityComponent.sol";

library LibRarity {
  function set(IUintComp components, uint256 id, uint256 value) internal {
    RarityComponent(getAddressById(components, RarityCompID)).set(id, value);
  }

  function unset(IUintComp components, uint256 id) internal {
    if (has(components, id)) getComponentById(components, RarityCompID).remove(id);
  }

  function has(IUintComp components, uint256 id) internal view returns (bool) {
    return RarityComponent(getAddressById(components, RarityCompID)).has(id);
  }

  function get(IUintComp components, uint256 id) internal view returns (uint256) {
    if (!has(components, id)) return 0;
    return RarityComponent(getAddressById(components, RarityCompID)).get(id);
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
      tier = get(components, registryIDs[i]);
      if (tier > 0) rarities[i] = 1 << (tier - 1);
    }
  }
}
