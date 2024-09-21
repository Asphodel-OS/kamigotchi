// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";
import { LibComp } from "libraries/utils/LibComp.sol";

import { IdHolderComponent, ID as IdHolderCompID } from "components/IdHolderComponent.sol";
import { IDScoreTypeComponent, ID as IDScoreTypeCompID } from "components/IDScoreTypeComponent.sol";
import { TypeComponent, ID as TypeCompID } from "components/TypeComponent.sol";
import { ValueComponent, ID as ValueCompID } from "components/ValueComponent.sol";

import { LibConfig } from "libraries/LibConfig.sol";

// entityID for leaderboard's current epoch. Contains just the Epoch component, declared in initSystem.
uint256 constant LEADERBOARD_EPOCH_ID = uint256(keccak256("Leaderboard.Epoch"));

// A score entity is similar to a fungible inventory entity.
// This library is called whenever a pet conducts a score gaining operation,
// like reaping production

// Components:
// EntityID: hash(IdHolder, score type, epoch)
// IdScoreType: reverse map to score type (e.g. hash(score type, epoch), goalID)
// Balance: Score balance

library LibScore {
  using LibComp for IUintComp;

  /////////////////
  // INTERACTIONS

  function create(IUintComp components, uint256 id, uint256 holderID, uint256 typeID) internal {
    IdHolderComponent(getAddrByID(components, IdHolderCompID)).set(id, holderID);
    IDScoreTypeComponent(getAddrByID(components, IDScoreTypeCompID)).set(id, typeID);
  }

  function createFor(IUintComp components, uint256 id, uint256 holderID, uint256 typeID) internal {
    IDScoreTypeComponent typeComp = IDScoreTypeComponent(
      getAddrByID(components, IDScoreTypeCompID)
    );
    if (!typeComp.has(id)) {
      typeComp.set(id, typeID);
      IdHolderComponent(getAddrByID(components, IdHolderCompID)).set(id, holderID);
    }
  }

  /// @notice increments score balance, creates score if needed
  function incFor(
    IUintComp components,
    uint256 id,
    uint256 holderID,
    uint256 typeID,
    uint256 amt
  ) internal {
    createFor(components, id, holderID, typeID);
    IUintComp(getAddrByID(components, ValueCompID)).inc(id, amt);
  }

  /// @notice adds score based on current epoch.
  /// @dev wrapper function for epoch/type handling
  function incFor(
    IUintComp components,
    uint256 holderID,
    string memory _type,
    uint256 amt
  ) internal {
    uint256 epoch = getCurentEpoch(components);
    uint256 id = genScoreID(holderID, epoch, _type);
    incFor(components, id, holderID, genTypeID(_type, epoch), amt);
  }

  /// @notice decrements score balance, creates score if needed
  function decFor(
    IUintComp components,
    uint256 id,
    uint256 holderID,
    uint256 typeID,
    uint256 amt
  ) internal {
    createFor(components, id, holderID, typeID);
    IUintComp(getAddrByID(components, ValueCompID)).dec(id, amt);
  }

  /// @notice decs score based on current epoch.
  /// @dev wrapper function for epoch/type handling
  function decFor(
    IUintComp components,
    uint256 holderID,
    string memory _type,
    uint256 amt
  ) internal {
    uint256 epoch = getCurentEpoch(components);
    uint256 id = genScoreID(holderID, epoch, _type);
    decFor(components, id, holderID, genTypeID(_type, epoch), amt);
  }

  /////////////////
  // GETTERS

  function get(IUintComp components, uint256 id) internal view returns (uint256) {
    return IUintComp(getAddrByID(components, ValueCompID)).safeGetUint256(id);
  }

  // get current epoch for leaderboard
  function getCurentEpoch(IUintComp components) internal view returns (uint256) {
    return LibConfig.get(components, "LEADERBOARD_EPOCH");
  }

  /////////////////
  // SETTERS

  /// @notice set current epoch for leaderboard. shoud only be called by owner
  function setCurrentEpoch(IUintComp components, uint256 epoch) internal {
    uint256 id = LibConfig.getID("LEADERBOARD_EPOCH");
    LibConfig.setValue(components, id, epoch);
  }

  /////////////////
  // UTILS

  function genScoreID(
    uint256 holderID,
    uint256 epoch,
    string memory type_
  ) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("is.score", holderID, epoch, type_)));
  }

  function genTypeID(string memory scoreType, uint256 epoch) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("score.type", scoreType, epoch)));
  }
}
