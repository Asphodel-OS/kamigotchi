// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibPet721 } from "libraries/LibPet721.sol";
import { LibPet } from "libraries/LibPet.sol";

uint256 constant ID = uint256(keccak256("system.Pet721.Stake"));
uint256 constant ROOM = 12;

/// @notice DEPRECIATED sets a pet outside world => game world
/** @dev
 * Room 12 is the bridge room, system can only be called there
 *  Invariants:
 *    Before deposit:
 *      1) Pet does not have an Account, owned by EOA
 *      2) Pet state is "721_EXTERNAL"
 *    After deposit:
 *      1) Pet is linked to Account owned by msg.sender, token owned by Pet721
 *      2) Pet state is not "721_EXTERNAL"
 * 
    {
      "name": "Pet721StakeSystem",
      "writeAccess": [
        "AddressOperatorComponent",
        "AddressOwnerComponent",
        "IdAccountComponent",
        "IDOwnsPetComponent",
        "IdHolderComponent",
        "IsAccountComponent",
        "IndexRoomComponent",
        "NameComponent",
        "ProxyPermissionsERC721Component",
        "StaminaComponent",
        "StateComponent",
        "TimeLastComponent",
        "TypeComponent",
        "ValueComponent"
      ]
    },
 */
contract Pet721StakeSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256 tokenID = abi.decode(arguments, (uint256));
    uint256 petID = LibPet.getByIndex(components, uint32(tokenID));
    uint256 accID = LibAccount.getByOwner(components, msg.sender);

    // account checks
    require(accID != 0, "Pet721Stake: no account detected");
    require(LibAccount.getRoom(components, accID) == ROOM, "Pet721Stake: must be in room 12");

    // checks before action
    require(LibPet721.getEOAOwner(world, tokenID) == msg.sender, "Pet721Stake: not urs");
    require(LibPet.getAccount(components, petID) == 0, "Pet721Stake: already linked");
    require(!LibPet.isInWorld(components, petID), "Pet721Stake: already in world");

    LibPet.stake(components, petID, accID);
    LibPet721.stake(world, msg.sender, tokenID);

    // standard logging and tracking
    LibAccount.logIncPetsStaked(world, components, accID, 1);
    LibAccount.updateLastTs(components, accID);
    return "";
  }

  function executeTyped(uint256 tokenID) public returns (bytes memory) {
    return execute(abi.encode(tokenID));
  }
}
