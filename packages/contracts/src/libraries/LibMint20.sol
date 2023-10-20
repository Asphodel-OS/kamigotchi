// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { QueryFragment, QueryType } from "solecs/interfaces/Query.sol";
import { LibQuery } from "solecs/LibQuery.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

import { Base64 } from "solady/utils/Base64.sol";
import { LibString } from "solady/utils/LibString.sol";

import { Mint20ProxySystem, ID as Mint20ProxyID } from "systems/Mint20ProxySystem.sol";
import { Mint20 } from "tokens/Mint20.sol";

library LibMint20 {
  ////////////////////////
  // INTERACTIONS

  /// @notice DEPRECIATED mints mint20 tokens
  function mint(IWorld world, address to, uint256 amount) internal {
    getContract(world).depreciatedMint(to, amount);
  }

  /// @notice burns mint20 tokens
  function burn(IWorld world, address from, uint256 amount) internal {
    getContract(world).burn(from, amount);
  }

  ///////////////////////
  // GETTERS

  /// @notice get mint token contract
  function getContract(IWorld world) internal view returns (Mint20) {
    return Mint20ProxySystem(getAddressById(world.systems(), Mint20ProxyID)).getToken();
  }

  /// @notice DEPRECIATED get totalMinted of mint20 token
  function getTotalMinted(IWorld world) internal view returns (uint256) {
    return getContract(world).getTotalMinted();
  }
}
