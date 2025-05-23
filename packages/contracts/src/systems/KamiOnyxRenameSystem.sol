// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { LibString } from "solady/utils/LibString.sol";
import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibData } from "libraries/LibData.sol";
import { LibKami } from "libraries/LibKami.sol";
import { LibInventory, ONYX_INDEX } from "libraries/LibInventory.sol";

uint256 constant ID = uint256(keccak256("system.kami.onyx.rename"));

uint32 constant ROOM_INDEX = 11;
uint256 constant PRICE = 5000; // 5.000

// name pet
contract KamiOnyxRenameSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256 id, string memory name) = abi.decode(arguments, (uint256, string));
    uint256 accID = LibAccount.getByOwner(components, msg.sender);

    // general validation
    LibKami.verifyAccount(components, id, accID);
    if (LibKami.getRoom(components, id) != ROOM_INDEX) revert("PetName: must be in room 11");

    // name validation
    if (bytes(name).length == 0) revert("PetName: name cannot be empty");
    if (bytes(name).length > 16) revert("PetName: name can be at most 16 characters");
    if (LibKami.getByName(components, name) != 0) revert("PetName: name taken");

    // spend onyx and set name
    LibInventory.decFor(components, accID, ONYX_INDEX, PRICE);
    LibKami.setName(components, id, name);

    // standard logging and tracking
    LibKami.logNameChange(components, accID);
    LibAccount.updateLastTs(components, accID);
    LibData.inc(components, accID, ONYX_INDEX, "TOKEN_SPEND", PRICE);
    LibData.inc(components, 0, ONYX_INDEX, "TOKEN_SPEND", PRICE);
    LibData.inc(components, 0, ONYX_INDEX, "TOKEN_SPEND_RENAME", PRICE);

    return "";
  }

  function executeTyped(uint256 id, string memory name) public returns (bytes memory) {
    return execute(abi.encode(id, name));
  }
}
