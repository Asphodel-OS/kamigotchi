// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID } from "solecs/utils.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibKami721 } from "libraries/LibKami721.sol";
import { LibKami } from "libraries/LibKami.sol";

uint256 constant ID = uint256(keccak256("system.kami721.stake"));
uint256 constant ROOM = 12;

/// @notice DEPRECIATED sets a pet outside world => game world
/** @dev
 * Room 12 is the bridge room, system can only be called there
 *  Invariants:
 *    Before deposit:
 *      1) Pet does not have an Account, owned by EOA
 *      2) Pet state is "721_EXTERNAL"
 *    After deposit:
 *      1) Pet is linked to Account owned by msg.sender, token owned by Kami721
 *      2) Pet state is not "721_EXTERNAL"
 * 
    {
      "name": "Kami721StakeSystem",
      "writeAccess": [
        "AddressOperatorComponent",
        "AddressOwnerComponent",
        "IDOwnsKamiComponent",
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
contract Kami721StakeSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256 tokenIndex = abi.decode(arguments, (uint256));
    uint256 kamiID = LibKami.getByIndex(components, uint32(tokenIndex));
    uint256 accID = LibAccount.getByOwner(components, msg.sender);

    // account checks
    require(accID != 0, "Kami721Stake: no account detected");
    require(LibAccount.getRoom(components, accID) == ROOM, "Kami721Stake: must be in room 12");

    // checks before action
    require(LibKami721.getEOAOwner(components, tokenIndex) == msg.sender, "Kami721Stake: not urs");
    require(LibKami.getAccount(components, kamiID) == 0, "Kami721Stake: already linked");
    require(!LibKami.isInWorld(components, kamiID), "Kami721Stake: already in world");

    LibKami.stake(components, kamiID, accID);
    LibKami721.stake(components, msg.sender, tokenIndex);

    // standard logging and tracking
    LibAccount.logIncKamisStaked(world, components, accID, 1);
    LibAccount.updateLastTs(components, accID);
    return "";
  }

  function executeTyped(uint256 tokenIndex) public returns (bytes memory) {
    return execute(abi.encode(tokenIndex));
  }
}
