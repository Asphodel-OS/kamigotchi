// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { LibTypes } from "solecs/LibTypes.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibConfig } from "libraries/LibConfig.sol";
import { LibData } from "libraries/LibData.sol";
import { LibKami } from "libraries/LibKami.sol";
import { LibKamiMarket } from "libraries/LibKamiMarket.sol";
import { LibCooldown } from "libraries/utils/LibCooldown.sol";
import { LibEmitter } from "libraries/utils/LibEmitter.sol";

uint256 constant ID = uint256(keccak256("system.kami.send"));

/// @notice Send in-world (staked) kamis to another player without unstaking
contract KamiSendSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint32[] memory kamiIndices, address toAddress) = abi.decode(arguments, (uint32[], address));
    return _send(kamiIndices, toAddress);
  }

  /// @notice Send a single kami to another player
  function executeTyped(uint32 kamiIndex, address toAddress) public returns (bytes memory) {
    uint32[] memory indices = new uint32[](1);
    indices[0] = kamiIndex;
    return _send(indices, toAddress);
  }

  /// @notice Batch send multiple kamis to another player
  function executeTyped(uint32[] memory kamiIndices, address toAddress) public returns (bytes memory) {
    return _send(kamiIndices, toAddress);
  }

  function _send(uint32[] memory kamiIndices, address toAddress) internal returns (bytes memory) {
    require(kamiIndices.length > 0, "KamiSend: empty batch");

    uint256 senderAccID = LibAccount.verifyOperator(components);
    uint256 targetAccID = LibAccount.getByOperator(components, toAddress);
    require(senderAccID != targetAccID, "KamiSend: cannot send to self");

    // pre-compute cooldown config once
    uint256 cd = LibConfig.has(components, "KAMI_MARKET_PURCHASE_COOLDOWN")
      ? LibConfig.get(components, "KAMI_MARKET_PURCHASE_COOLDOWN")
      : 3600;

    for (uint256 i; i < kamiIndices.length; i++) {
      uint32 kamiIndex = kamiIndices[i];

      // verify kami is owned and RESTING or LISTED
      LibKamiMarket.verifyKamiOwnedRestingOrListed(components, kamiIndex, senderAccID);
      uint256 kamiID = LibKami.getByIndex(components, kamiIndex);

      // if listed, cancel all listings first
      LibKamiMarket.cancelListingsForKami(world, components, kamiIndex);

      // reassign ownership and set RESTING
      LibKami.setOwner(components, kamiID, targetAccID);
      LibKami.setState(components, kamiID, "RESTING");

      // apply purchase cooldown
      if (cd > 0) LibCooldown.modify(components, kamiID, int256(cd));

      // log and emit
      LibData.inc(components, senderAccID, 0, "KAMI_SEND", 1);
      _emitSend(senderAccID, targetAccID, kamiIndex);
    }

    LibAccount.updateLastTs(components, senderAccID);
    return "";
  }

  function _emitSend(uint256 senderAccID, uint256 targetAccID, uint32 kamiIndex) internal {
    uint8[] memory _schema = new uint8[](3);
    _schema[0] = uint8(LibTypes.SchemaValue.UINT256);
    _schema[1] = uint8(LibTypes.SchemaValue.UINT256);
    _schema[2] = uint8(LibTypes.SchemaValue.UINT32);
    LibEmitter.emitEvent(world, "KAMI_SEND", _schema, abi.encode(senderAccID, targetAccID, kamiIndex));
  }
}
