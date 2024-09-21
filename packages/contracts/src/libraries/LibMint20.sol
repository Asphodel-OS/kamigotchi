// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";

import { Mint20 } from "tokens/Mint20.sol";

import { LibConfig } from "libraries/LibConfig.sol";

/// NOTE: world2 deprecated; Mint20 will be a regular item type
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
    // return Mint20(0xC35910787eD3309AA9FAA66299EfF37a94b0E713);
    address addr = address(uint160(LibConfig.get(world.components(), "MINT20_ADDRESS")));
    return Mint20(addr);
  }

  /// @notice DEPRECIATED get totalMinted of mint20 token
  function getTotalMinted(IWorld world) internal view returns (uint256) {
    return getContract(world).getTotalMinted();
  }
}
