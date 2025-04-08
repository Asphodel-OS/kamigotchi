// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";

import { IdHolderComponent, ID as IdHolderCompID } from "components/IdHolderComponent.sol";
import { IDTypeComponent, ID as IDTypeCompID } from "components/IDTypeComponent.sol";
import { ValueComponent, ID as ValueCompID } from "components/ValueComponent.sol";

import { LibComp } from "libraries/utils/LibComp.sol";
import { LibConfig } from "libraries/LibConfig.sol";

/** @notice
 * Scores track points for an individual entity & total points for a type.
 * It can be used on its own, or as part of a bigger shape (e.g. faction/goal)
 *
 * Scores > Data when:
 *  - Value is reverse mappable on FE (e.g. leaderboards)
 *  - A global total per type is tracked
 *  - An individual's % in the total is needed
 *
 * Shape: (ID depends on context)
 *  - IdHolder
 *  - IDType (defined by context. defaults to hash(epoch, index, type))
 *  - Value (score)
 *  - Total: ValueComp with ID = hash("score.total", typeID)
 *
 * Epoch:
 *  - Defaults to use epoch when a string is given for ScoreType
 *  - To differentiate between default score use (points for a given epoch) and others (e.g. faction)
 *  - Epoch is a config field. Could be automated on block.timestamp in the future
 */
library LibScore {
  using LibComp for IUintComp;

  /////////////////
  // INTERACTIONS

  function create(IUintComp components, uint256 id, uint256 holderID, uint256 typeID) internal {
    IdHolderComponent(getAddrByID(components, IdHolderCompID)).set(id, holderID);
    IDTypeComponent(getAddrByID(components, IDTypeCompID)).set(id, typeID);
  }

  function createFor(IUintComp components, uint256 id, uint256 holderID, uint256 typeID) internal {
    IDTypeComponent typeComp = IDTypeComponent(getAddrByID(components, IDTypeCompID));
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
    ValueComponent valueComp = ValueComponent(getAddrByID(components, ValueCompID));
    valueComp.inc(id, amt); // increase individual score
    valueComp.inc(genTotalStoreID(typeID), amt); // increase total score
  }

  /// @notice adds score based on current epoch.
  /// @dev wrapper function for epoch/type handling
  function incFor(
    IUintComp components,
    uint256 holderID,
    uint32 index,
    string memory _type,
    uint256 amt
  ) internal {
    uint256 epoch = getCurentEpoch(components);
    uint256 id = genScoreID(holderID, epoch, index, _type);
    incFor(components, id, holderID, genTypeID(epoch, index, _type), amt);
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
    ValueComponent valueComp = ValueComponent(getAddrByID(components, ValueCompID));
    valueComp.dec(id, amt); // decrease individual score
    valueComp.dec(genTotalStoreID(typeID), amt); // decrease total score
  }

  /// @notice decs score based on current epoch.
  /// @dev wrapper function for epoch/type handling
  function decFor(
    IUintComp components,
    uint256 holderID,
    uint32 index,
    string memory _type,
    uint256 amt
  ) internal {
    uint256 epoch = getCurentEpoch(components);
    uint256 id = genScoreID(holderID, epoch, index, _type);
    decFor(components, id, holderID, genTypeID(epoch, index, _type), amt);
  }

  /////////////////
  // GETTERS

  function get(IUintComp components, uint256 id) internal view returns (uint256) {
    return IUintComp(getAddrByID(components, ValueCompID)).safeGet(id);
  }

  // get current epoch for leaderboard
  function getCurentEpoch(IUintComp components) internal view returns (uint256) {
    return LibConfig.get(components, "SCORE_EPOCH");
  }

  /////////////////
  // SETTERS

  /// @notice set current epoch for leaderboard. shoud only be called by owner
  function setCurrentEpoch(IUintComp components, uint256 epoch) internal {
    LibConfig.set(components, "SCORE_EPOCH", epoch);
  }

  /////////////////
  // UTILS

  function genScoreID(
    uint256 holderID,
    uint256 epoch,
    uint32 index,
    string memory type_
  ) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("is.score", holderID, epoch, index, type_)));
  }

  function genTypeID(
    uint256 epoch,
    uint32 index,
    string memory scoreType
  ) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("score.type", epoch, index, scoreType)));
  }

  // ID for total score of type
  function genTotalStoreID(uint256 typeID) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("score.total", typeID)));
  }
}
