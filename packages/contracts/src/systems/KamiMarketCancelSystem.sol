// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { AuthRoles } from "libraries/utils/AuthRoles.sol";
import { LibEntityType } from "libraries/utils/LibEntityType.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibKamiMarket } from "libraries/LibKamiMarket.sol";

uint256 constant ID = uint256(keccak256("system.kamimarket.cancel"));

/// @notice Cancel any order — restore kami state (listings) or just mark cancelled (offers)
contract KamiMarketCancelSystem is System, AuthRoles {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256 id = abi.decode(arguments, (uint256));

    uint256 accID = LibAccount.getByOwner(components, msg.sender);
    LibKamiMarket.verifyActive(components, id);
    LibKamiMarket.verifyOwner(components, id, accID);

    _cancel(id, accID);
    return "";
  }

  /// @notice Admin cancel — can cancel any order
  function executeAdmin(uint256[] memory ids) public onlyAdmin(components) {
    for (uint256 i; i < ids.length; i++) {
      uint256 id = ids[i];
      LibKamiMarket.verifyActive(components, id);
      uint256 ownerAccID = LibKamiMarket.getOwner(components, id);
      _cancel(id, ownerAccID);
    }
  }

  function _cancel(uint256 id, uint256 accID) internal {
    string memory orderType = LibEntityType.get(components, id);

    if (keccak256(bytes(orderType)) == keccak256(bytes("KAMI_LISTING"))) {
      LibKamiMarket.cancelListing(components, id);
    } else {
      // KAMI_OFFER or KAMI_COLLECTION_OFFER — no kami/WETH to return
      LibKamiMarket.cancelOffer(components, id);
    }

    LibKamiMarket.emitCancel(world, id, accID);
    LibKamiMarket.logCancel(components, accID);
    LibAccount.updateLastTs(components, accID);
  }

  /// @param id Order entity ID to cancel
  function executeTyped(uint256 id) public returns (bytes memory) {
    return execute(abi.encode(id));
  }
}
