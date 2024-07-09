// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { IndexItemComponent, ID as IndexItemCompID } from "components/IndexItemComponent.sol";

import { LibInventory } from "libraries/LibInventory.sol";

uint256 constant ID = uint256(keccak256("system._admin.delete.item.1001"));

contract _ItemDelete1001System is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    uint256[] memory ids = abi.decode(arguments, (uint256[]));

    // checking if item indicies match 1001
    IndexItemComponent indexComp = IndexItemComponent(getAddressById(components, IndexItemCompID));
    for (uint256 i = 0; i < ids.length; i++) {
      require(indexComp.get(ids[i]) == 1001, "ItemDelete1001: not 1001");
    }

    // deleting inv
    for (uint256 i = 0; i < ids.length; i++) {
      LibInventory.del(components, ids[i]);
    }

    return new bytes(0);
  }

  function executeTyped(uint256[] memory ids) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(ids));
  }
}
