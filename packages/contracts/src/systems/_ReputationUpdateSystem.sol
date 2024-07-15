// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { IndexItemComponent, ID as IndexItemCompID } from "components/IndexItemComponent.sol";

import { LibInventory } from "libraries/LibInventory.sol";

uint256 constant ID = uint256(keccak256("system._admin.update.reputation"));

contract _ItemDelete1001System is System {

  constructor(IWorld _world, address _components) System(_world, _components) {}
  
  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    ( 
      uint256[] memory accountIds,
      uint256[] memory accountReputation
    ) = abi.decode(arguments, (uint256[],uint256[]));
    require(accountIds.length == accountReputation.length, "Arrays must match in length");
    for(uint256 i; i < accountIds.length; i++) {
      //reputation[accountIds[i], faction] = accountReputation[i];
    }

    return new bytes(0);
  }
  function executeTyped(uint256[] memory accountIds, uint256[] memory accountReputation) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(accountIds, accountReputation));
  }
}