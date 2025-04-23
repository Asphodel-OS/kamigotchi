// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID } from "solecs/utils.sol";

import { MediaURIComponent, ID as MediaURICompID } from "components/MediaURIComponent.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibKami } from "libraries/LibKami.sol";

uint256 constant ID = uint256(keccak256("system.account.set.pfp"));

/// @notice sets account PFP based on one of their owned kamis
contract AccountSetPFPSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256 kamiID = abi.decode(arguments, (uint256));

    uint256 accID = LibAccount.getByOperator(components, msg.sender);
    LibKami.verifyAccount(components, kamiID, accID);

    // setting pfp
    MediaURIComponent mediaComp = MediaURIComponent(getAddrByID(components, MediaURICompID));
    mediaComp.set(accID, mediaComp.get(kamiID));

    // standard logging and tracking
    LibAccount.updateLastTs(components, accID);
    return "";
  }

  function executeTyped(uint256 kamiID) public returns (bytes memory) {
    return execute(abi.encode(kamiID));
  }
}
