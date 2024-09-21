// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID } from "solecs/utils.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibData } from "libraries/LibData.sol";
import { LibPet721 } from "libraries/LibPet721.sol";
import { LibPet } from "libraries/LibPet.sol";

uint256 constant ID = uint256(keccak256("system.Pet721.Unstake"));
uint256 constant ROOM = 12;

/// @notice DEPRECIATED sets a pet game world => outside world
/** @dev
 * Room 12 is the bridge room, system can only be called there
 *  Invarients:
 *    Before withdrawal:
 *      1) Pet is linked to an Account owned by address, token owned by Pet721
 *      2) Pet state is not "721_EXTERNAL" + Pet stats is "RESTING"
 *      3) Pet is revealed
 *    After withdrawal:
 *      1) Pet is not linked to an Account, owned by EOA
 *      2) Pet state is "721_EXTERNAL"
 *
 *  *     {
      "name": "Pet721UnstakeSystem",
      "writeAccess": [
        "IdAccountComponent",
        "IDOwnsPetComponent",
        "IdHolderComponent",
        "ProxyPermissionsERC721Component",
        "StateComponent",
        "TimeLastComponent",
        "TypeComponent",
        "ValueComponent"
      ]
    },
 */
contract Pet721UnstakeSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256 tokenID = abi.decode(arguments, (uint256));
    uint256 petID = LibPet.getByIndex(components, uint32(tokenID));
    uint256 accID = LibAccount.getByOwner(components, msg.sender);

    // account checks
    require(accID != 0, "Pet721Stake: no account detected");
    require(LibAccount.getRoom(components, accID) == ROOM, "Pet721Stake: must be in room 12");

    // checks before action
    LibPet.assertAccount(components, petID, accID);
    require(LibPet.isResting(components, petID), "Pet721Unstake: must be resting");

    // actions to be taken upon bridging out
    LibPet.unstake(components, petID);
    LibPet721.unstake(components, msg.sender, tokenID);

    // standard logging and tracking
    LibData.inc(components, accID, 0, "PET721_UNSTAKE", 1);
    LibAccount.updateLastTs(components, accID);
    return "";
  }

  function executeTyped(uint256 tokenID) public returns (bytes memory) {
    return execute(abi.encode(tokenID));
  }
}
