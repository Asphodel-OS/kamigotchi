// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibRelationship } from "libraries/LibRelationship.sol";

uint256 constant ID = uint256(keccak256("system.Relationship.Advance"));

contract RelationshipAdvanceSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256 npcIndex, uint256 relIndex) = abi.decode(arguments, (uint256, uint256));
    uint256 accountID = LibAccount.getByOperator(components, msg.sender);

    require(accountID != 0, "RelationshipAdvance: no account");
    require(
      LibRelationship.has(components, accountID, npcIndex, relIndex),
      "RelationshipAdvance: flag already obtained"
    );
    require(
      LibRelationship.canCreate(components, accountID, npcIndex, relIndex),
      "RelationshipAdvance: unmet requirements"
    );

    LibRelationship.create(world, components, accountID, npcIndex, relIndex);

    return "";
  }

  function executeTyped(
    uint256 npcIndex,
    uint256 relIndex
  ) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(npcIndex, relIndex));
  }
}
