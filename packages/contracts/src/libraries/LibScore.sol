// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { LibQuery, QueryFragment, QueryType } from "solecs/LibQuery.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";
import { Strings } from "utils/Strings.sol";
import { LibPack } from "libraries/utils/LibPack.sol";

import { IdHolderComponent, ID as IdHolderCompID } from "components/IdHolderComponent.sol";
import { IsScoreComponent, ID as IsScoreCompID } from "components/IsScoreComponent.sol";
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
// [hashed] IdHolder
// [hashed] Epoch: The current epoch the score is gained
// [hashed] Type: The type of action being tracked (e.g. COLLECT | LIQUIDATE | FEED)
// BareVaue: Score balance

library LibScore {
  function getID(
    uint256 holderID,
    uint256 epoch,
    string memory type_
  ) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("is.score", holderID, epoch, type_)));
  }

  /////////////////
  // INTERACTIONS

  /// @notice creates a score entity for a holder
  function create(
    IUintComp components,
    uint256 id,
    uint256 holderID,
    uint256 epoch,
    string memory type_
  ) internal returns (uint256) {
    IdHolderComponent(getAddressById(components, IdHolderCompID)).set(id, holderID);
    IsScoreComponent(getAddressById(components, IsScoreCompID)).set(id);
    EpochComponent(getAddressById(components, EpochCompID)).set(id, epoch);
    TypeComponent(getAddressById(components, TypeCompID)).set(id, type_);
    return id;
  }

  /// @notice adds score based on current epoch.
  /// @dev to be called with any action that should be scored
  function inc(IUintComp components, uint256 holderID, string memory _type, uint256 amt) internal {
    uint256 epoch = getCurentEpoch(components);
    uint256 id = getID(holderID, epoch, _type);

    BalanceComponent comp = BalanceComponent(getAddressById(components, BalanceCompID));
    uint256 bal;
    if (comp.has(id)) bal = comp.get(id);
    else create(components, id, holderID, epoch, _type);
    bal += amt;
    comp.set(id, bal);
  }

  /// @notice decs score based on current epoch.
  /// @dev to be called with any action that should be scored
  function dec(IUintComp components, uint256 holderID, string memory _type, uint256 amt) internal {
    uint256 epoch = getCurentEpoch(components);
    uint256 id = getID(holderID, epoch, _type);

    BalanceComponent comp = BalanceComponent(getAddressById(components, BalanceCompID));
    uint256 bal;
    if (comp.has(id)) bal = comp.get(id);
    else create(components, id, holderID, epoch, _type);
    bal -= amt;
    comp.set(id, bal);
  }

  function incArr(
    IUintComp components,
    uint256 holderID,
    string memory _type,
    uint32[8] memory amt
  ) internal {
    uint256 epoch = getCurentEpoch(components);
    uint256 id = getID(holderID, epoch, _type);

    BalanceComponent comp = BalanceComponent(getAddressById(components, BalanceCompID));
    uint32[8] memory bal = [uint32(0), 0, 0, 0, 0, 0, 0, 0];
    if (comp.has(id)) bal = LibPack.unpackArrU32(comp.get(id));
    else create(components, id, holderID, epoch, _type);
    for (uint256 i; i < 8; i++) bal[i] += amt[i];
    comp.set(id, LibPack.packArrU32(bal));
  }

  function decArr(
    IUintComp components,
    uint256 holderID,
    string memory _type,
    uint32[8] memory amt
  ) internal {
    uint256 epoch = getCurentEpoch(components);
    uint256 id = getID(holderID, epoch, _type);

    BalanceComponent comp = BalanceComponent(getAddressById(components, BalanceCompID));
    uint32[8] memory bal = [uint32(0), 0, 0, 0, 0, 0, 0, 0];
    if (comp.has(id)) bal = LibPack.unpackArrU32(comp.get(id));
    else create(components, id, holderID, epoch, _type);
    for (uint256 i; i < 8; i++) bal[i] -= amt[i];
    comp.set(id, LibPack.packArrU32(bal));
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
}
