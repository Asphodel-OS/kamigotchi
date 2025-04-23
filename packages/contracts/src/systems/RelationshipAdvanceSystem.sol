// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibNPC } from "libraries/LibNPC.sol";
import { LibRelationship } from "libraries/LibRelationship.sol";
import { LibRelationshipRegistry } from "libraries/LibRelationshipRegistry.sol";

uint256 constant ID = uint256(keccak256("system.relationship.advance"));

contract RelationshipAdvanceSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint32 npcIndex, uint32 relIndex) = abi.decode(arguments, (uint32, uint32));
    uint256 accID = LibAccount.getByOperator(components, msg.sender);

    // npc existence and roomIndex check
    uint256 npcID = LibNPC.get(components, npcIndex);
    require(npcID != 0, "RS: npc does not exist");
    require(LibNPC.sharesRoomWith(components, npcID, accID), "RS: must be in same room");

    // check that the flag exists and that the account doesnt already have it
    uint256 registryID = LibRelationshipRegistry.get(components, npcIndex, relIndex);
    require(registryID != 0, "RS: flag does not exist");
    require(
      !LibRelationship.has(components, accID, npcIndex, relIndex),
      "RS: flag already obtained"
    );

    // check blacklist and whitelist
    require(
      !LibRelationship.isBlacklisted(components, accID, registryID),
      "RS: prohibited from advancing"
    );
    require(LibRelationship.isWhitelisted(components, accID, registryID), "RS: unmet requirements");

    uint256 id = LibRelationship.create(components, accID, npcIndex, relIndex);

    // standard logging and tracking
    LibAccount.updateLastTs(components, accID);
    return abi.encode(id);
  }

  function executeTyped(uint32 npcIndex, uint32 relIndex) public returns (bytes memory) {
    return execute(abi.encode(npcIndex, relIndex));
  }
}
