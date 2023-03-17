// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibMerchant } from "libraries/LibMerchant.sol";

uint256 constant ID = uint256(keccak256("system._Merchant.Create"));

// _MerchantCreateSystem creates or updates a merchant listing from the provided parameters
contract _MerchantCreateSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    (string memory name, uint256 location) = abi.decode(arguments, (string, uint256));

    return abi.encode(LibMerchant.create(world, components, location, name));
  }

  function executeTyped(
    string memory name,
    uint256 location
  ) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(name, location));
  }
}
