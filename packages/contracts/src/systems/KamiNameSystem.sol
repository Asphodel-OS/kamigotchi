// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { LibString } from "solady/utils/LibString.sol";
import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID } from "solecs/utils.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibKami } from "libraries/LibKami.sol";
import { LibInventory } from "libraries/LibInventory.sol";
import { LibItem } from "libraries/LibItem.sol";

uint256 constant ID = uint256(keccak256("system.kami.name"));

uint32 constant ROOM_INDEX = 11;
uint32 constant HOLY_DUST_INDEX = 11011;

// name pet
contract KamiNameSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256 id, string memory name) = abi.decode(arguments, (uint256, string));
    uint256 accID = LibAccount.getByOperator(components, msg.sender);

    // general validation
    LibKami.verifyAccount(components, id, accID);
    if (LibKami.getRoom(components, id) != ROOM_INDEX) revert("PetName: must be in room 11");

    // holy dust balance check
    uint256 balance = LibInventory.getBalanceOf(components, accID, HOLY_DUST_INDEX);
    if (balance == 0) revert("PetName: You need Holy Dust for this");

    // name validation
    if (bytes(name).length == 0) revert("PetName: name cannot be empty");
    if (bytes(name).length > 16) revert("PetName: name can be at most 16 characters");
    if (LibKami.getByName(components, name) != 0) revert("PetName: name taken");

    // consume holy dust and set name
    LibInventory.decFor(components, accID, HOLY_DUST_INDEX, 1);
    LibKami.setName(components, id, name);

    // standard logging and tracking
    LibKami.logNameChange(components, accID);
    LibItem.logUse(components, accID, HOLY_DUST_INDEX, 1, "KAMI");
    LibAccount.updateLastTs(components, accID);

    return "";
  }

  function executeTyped(uint256 id, string memory name) public returns (bytes memory) {
    return execute(abi.encode(id, name));
  }
}
