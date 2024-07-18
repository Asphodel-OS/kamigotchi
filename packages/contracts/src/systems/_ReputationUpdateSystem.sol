// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { IndexItemComponent, ID as IndexItemCompID } from "components/IndexItemComponent.sol";

import { LibFactions } from "libraries/LibFactions.sol";

uint256 constant ID = uint256(keccak256("system._admin.update.reputation"));

contract _ReputationUpdateSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    (uint256[] memory accIDs, uint256[] memory amts) = abi.decode(
      arguments,
      (uint256[], uint256[])
    );
    require(accIDs.length == amts.length, "Arrays must match in length");
    for (uint256 i; i < accIDs.length; i++) {
      LibFactions.incRep(components, accIDs[i], 1, amts[i]);
    }

    return new bytes(0);
  }
  function executeTyped(
    uint256[] memory accIDs,
    uint256[] memory toIncs
  ) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(accIDs, toIncs));
  }
}
