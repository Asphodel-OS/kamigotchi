// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { LibQuery, QueryFragment, QueryType } from "solecs/LibQuery.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";
import { Strings } from "utils/Strings.sol";
import { LibPack } from "libraries/utils/LibPack.sol";

import { IdBareHolderComponent, ID as IdBareHolderCompID } from "components/IdBareHolderComponent.sol";
import { IdScoreTypeComponent, ID as IdScoreTypeCompID } from "components/IdScoreTypeComponent.sol";
import { EpochComponent, ID as EpochCompID } from "components/EpochComponent.sol";
import { TypeComponent, ID as TypeCompID } from "components/TypeComponent.sol";
import { BalanceComponent, ID as BalanceCompID } from "components/BalanceComponent.sol";
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
  /////////////////
  // INTERACTIONS

  function create(
    IUintComp components,
    uint256 id,
    uint256 holderID,
    uint256 typeID
  ) internal returns (uint256) {
    IdBareHolderComponent(getAddressById(components, IdBareHolderCompID)).set(id, holderID);
    IdScoreTypeComponent(getAddressById(components, IdScoreTypeCompID)).set(id, typeID);
  }

  /// @notice increments score balance, creates score if needed
  function inc(
    IUintComp components,
    uint256 id,
    uint256 holderID,
    uint256 typeID,
    uint256 amt
  ) internal {
    BalanceComponent comp = BalanceComponent(getAddressById(components, BalanceCompID));
    uint256 bal;
    if (comp.has(id)) bal = comp.get(id);
    else create(components, id, holderID, typeID);
    bal += amt;
    comp.set(id, bal);
  }

  /// @notice adds score based on current epoch.
  /// @dev wrapper function for epoch/type handling
  function inc(IUintComp components, uint256 holderID, string memory _type, uint256 amt) internal {
    uint256 epoch = getCurentEpoch(components);
    uint256 id = genScoreID(holderID, epoch, _type);
    inc(components, id, holderID, genTypeID(_type, epoch), amt);
  }

  /// @notice decrements score balance, creates score if needed
  function dec(
    IUintComp components,
    uint256 id,
    uint256 holderID,
    uint256 typeID,
    uint256 amt
  ) internal {
    BalanceComponent comp = BalanceComponent(getAddressById(components, BalanceCompID));
    uint256 bal;
    if (comp.has(id)) bal = comp.get(id);
    else create(components, id, holderID, typeID);
    bal -= amt;
    comp.set(id, bal);
  }

  /// @notice decs score based on current epoch.
  /// @dev wrapper function for epoch/type handling
  function dec(IUintComp components, uint256 holderID, string memory _type, uint256 amt) internal {
    uint256 epoch = getCurentEpoch(components);
    uint256 id = genScoreID(holderID, epoch, _type);

    dec(components, id, holderID, genTypeID(_type, epoch), amt);
  }

  /////////////////
  // GETTERS

  function getEpoch(IUintComp components, uint256 id) internal view returns (uint256) {
    return EpochComponent(getAddressById(components, EpochCompID)).get(id);
  }

  // get current epoch for leaderboard
  function getCurentEpoch(IUintComp components) internal view returns (uint256) {
    return LibConfig.get(components, "LEADERBOARD_EPOCH");
  }

  /////////////////
  // SETTERS

  // set current epoch for leaderboard. shoud only be called by owner
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
