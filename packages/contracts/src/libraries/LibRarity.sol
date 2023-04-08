// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { RarityComponent, ID as RarityCompID } from "components/RarityComponent.sol";

library LibRarity {
  // generates a key pair array from an array of componentIDs
  // assumes key component is uint256
  function getRarityKeyValueArr(
    IUint256Component components,
    uint256[] memory compIDs,
    uint256 keyComp
  ) internal view returns (uint256[] memory keys, uint256[] memory rarities) {
    keys = new uint256[](compIDs.length);
    rarities = new uint256[](compIDs.length);
    for (uint256 i; i < compIDs.length; i++) {
      IUint256Component rComp = IUint256Component(getAddressById(components, RarityCompID));
      if (rComp.has(compIDs[i])) {
        rarities[i] = rComp.getValue(compIDs[i]);
      } else {
        rarities[i] = 0;
      }
      keys[i] = IUint256Component(getAddressById(components, keyComp)).getValue(compIDs[i]);
    }
  }
}
