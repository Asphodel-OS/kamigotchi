// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibMerchant } from "libraries/LibMerchant.sol";

uint256 constant ID = uint256(keccak256("system._Merchant.Set.Location"));

// set the Location of a Merchant, identified by its Merchant Index
contract _MerchantSetLocationSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    (uint256 index, uint256 location) = abi.decode(arguments, (uint256, uint256));
    uint256 id = LibMerchant.getByIndex(components, index);

    require(id != 0, "Merchant: does not exist");

    LibMerchant.setLocation(components, id, location);
    return "";
  }

  function executeTyped(uint256 index, uint256 location) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(index, location));
  }
}
