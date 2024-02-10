// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibNPC } from "libraries/LibNPC.sol";
import { LibRelationship } from "libraries/LibRelationship.sol";
import { LibRegistryRelationship } from "libraries/LibRegistryRelationship.sol";

uint256 constant ID = uint256(keccak256("system.Relationship.Advance"));

contract RelationshipAdvanceSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256 npcIndex, uint256 relIndex) = abi.decode(arguments, (uint256, uint256));
    uint256 accountID = LibAccount.getByOperator(components, msg.sender);
    require(accountID != 0, "RelationshipAdvance: no account");

    // npc existence and roomIndex check
    uint256 npcID = LibNPC.getByIndex(components, npcIndex);
    require(npcID != 0, "RelationshipAdvance: npc does not exist");
    require(
      LibNPC.sharesRoomWith(components, npcID, accountID),
      "RelationshipAdvance: must be in same room"
    );

    // check that the flag exists and that the account doesnt already have it
    uint256 registryID = LibRegistryRelationship.get(components, npcIndex, relIndex);
    require(registryID != 0, "RelationshipAdvance: flag does not exist");
    require(
      !LibRelationship.has(components, accountID, npcIndex, relIndex),
      "RelationshipAdvance: flag already obtained"
    );

    // check blacklist and whitelist
    require(
      !LibRelationship.isBlacklisted(components, accountID, registryID),
      "RelationshipAdvance: prohibited from advancing"
    );
    require(
      LibRelationship.isWhitelisted(components, accountID, registryID),
      "RelationshipAdvance: unmet requirements"
    );

    LibRelationship.create(world, components, accountID, npcIndex, relIndex);

    // standard logging and tracking
    LibAccount.updateLastTs(components, accountID);
    return "";
  }

  function executeTyped(
    uint256 npcIndex,
    uint256 relIndex
  ) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(npcIndex, relIndex));
  }
}
