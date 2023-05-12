// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { QueryFragment, QueryType } from "solecs/interfaces/Query.sol";
import { LibQuery } from "solecs/LibQuery.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";
import { Strings } from "utils/Strings.sol";

import { IdHolderComponent, ID as IdHolderCompID } from "components/IdHolderComponent.sol";
import { IsScoreComponent, ID as IsScoreCompID } from "components/IsScoreComponent.sol";
import { EpochComponent, ID as EpochCompID } from "components/EpochComponent.sol";
import { TypeComponent, ID as TypeCompID } from "components/TypeComponent.sol";
import { BalanceComponent, ID as BalanceCompID } from "components/BalanceComponent.sol";

// entityID for leaderboard's current epoch. Contains just the Epoch component, declared in initSystem.
uint256 constant LEADERBOARD_EPOCH_ID = uint256(keccak256("Leaderboard.Epoch"));

// A score entity is similar to a fungible inventory entity.
// This library is called whenever a pet conducts a score gaining operation,
// like reaping production

// Components:
// IsScore
// IdHolder
// Epoch: The current epoch the score is gained
// Type: The operation that is linked to the score, e.g. *Insect* when reaping with insect pets
// Balance: Score balance

library LibScore {
  /////////////////
  // INTERACTIONS

  function create(
    IWorld world,
    IUintComp components,
    uint256 holderID,
    uint256 epoch,
    string memory _type
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    IsScoreComponent(getAddressById(components, IsScoreCompID)).set(id);
    IdHolderComponent(getAddressById(components, IdHolderCompID)).set(id, holderID);
    EpochComponent(getAddressById(components, EpochCompID)).set(id, epoch);
    TypeComponent(getAddressById(components, TypeCompID)).set(id, _type);
    BalanceComponent(getAddressById(components, BalanceCompID)).set(id, 0);
    return id;
  }

  // adds score based on current epoch. to be called with any action that should be scored
  function incBy(
    IWorld world,
    IUintComp components,
    uint256 holderID,
    string memory _type,
    uint256 amt
  ) internal {
    uint256 epoch = getLeaderboardEpoch(components);
    uint256 id = get(components, holderID, epoch, _type);
    if (id == 0) {
      id = create(world, components, holderID, epoch, _type);
    }

    inc(components, id, amt);
  }

  // Increase an score balance by the specified amount
  function inc(IUintComp components, uint256 id, uint256 amt) internal returns (uint256) {
    uint256 bal = getBalance(components, id);
    bal += amt;
    _set(components, id, bal);
    return bal;
  }

  // Decrease an score balance by the specified amount
  function dec(IUintComp components, uint256 id, uint256 amt) internal returns (uint256) {
    uint256 bal = getBalance(components, id);
    require(bal >= amt, "Score: insufficient balance");
    bal -= amt;
    if (bal == 0) {
      del(components, id);
    } else {
      _set(components, id, bal);
    }
    return bal;
  }

  function del(IUintComp components, uint256 id) internal {
    IsScoreComponent(getAddressById(components, IsScoreCompID)).remove(id);
    IdHolderComponent(getAddressById(components, IdHolderCompID)).remove(id);
    EpochComponent(getAddressById(components, EpochCompID)).remove(id);
    TypeComponent(getAddressById(components, TypeCompID)).remove(id);
    BalanceComponent(getAddressById(components, BalanceCompID)).remove(id);
  }

  /////////////////
  // GETTERS

  // get the balance of a instance. return 0 if none exists
  function getBalance(IUintComp components, uint256 id) internal view returns (uint256 balance) {
    BalanceComponent balanceComp = BalanceComponent(getAddressById(components, BalanceCompID));
    if (balanceComp.has(id)) {
      balance = balanceComp.getValue(id);
    }
  }

  function getEpoch(IUintComp components, uint256 id) internal view returns (uint256) {
    return EpochComponent(getAddressById(components, EpochCompID)).getValue(id);
  }

  function getHolder(IUintComp components, uint256 id) internal view returns (uint256) {
    return IdHolderComponent(getAddressById(components, IdHolderCompID)).getValue(id);
  }

  // get current epoch for leaderboard
  function getLeaderboardEpoch(IUintComp components) internal view returns (uint256) {
    return EpochComponent(getAddressById(components, EpochCompID)).getValue(LEADERBOARD_EPOCH_ID);
  }

  /////////////////
  // SETTERS

  // Set the balance of an existing entity
  function _set(IUintComp components, uint256 id, uint256 amt) internal {
    BalanceComponent(getAddressById(components, BalanceCompID)).set(id, amt);
  }

  // set current epoch for leaderboard. shoud only be called by owner
  function setLeaderboardEpoch(IUintComp components, uint256 epoch) internal {
    EpochComponent(getAddressById(components, EpochCompID)).set(LEADERBOARD_EPOCH_ID, epoch);
  }

  /////////////////
  // QUERIES

  // get a specific instance. assume only one exists
  function get(
    IUintComp components,
    uint256 holderID,
    uint256 epoch,
    string memory _type
  ) internal view returns (uint256 result) {
    uint256[] memory results = _getAllX(components, holderID, epoch, _type);
    if (results.length > 0) result = results[0];
  }

  function getAllForHolder(
    IUintComp components,
    uint256 holderID
  ) internal view returns (uint256[] memory) {
    return _getAllX(components, holderID, 0, "");
  }

  // get all entities matching filters. 0 values indicate no filter
  function _getAllX(
    IUintComp components,
    uint256 holderID,
    uint256 epoch,
    string memory _type
  ) internal view returns (uint256[] memory) {
    uint256 setFilters; // number of optional non-zero filters
    if (holderID != 0) setFilters++;
    if (epoch != 0) setFilters++;
    if (!Strings.equal(_type, "")) setFilters++;

    uint256 filterCount = 1; // number of mandatory filters
    QueryFragment[] memory fragments = new QueryFragment[](setFilters + filterCount);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsScoreCompID), "");

    if (holderID != 0) {
      fragments[filterCount++] = QueryFragment(
        QueryType.HasValue,
        getComponentById(components, IdHolderCompID),
        abi.encode(holderID)
      );
    }
    if (epoch != 0) {
      fragments[filterCount++] = QueryFragment(
        QueryType.HasValue,
        getComponentById(components, EpochCompID),
        abi.encode(epoch)
      );
    }
    if (!Strings.equal(_type, "")) {
      fragments[filterCount++] = QueryFragment(
        QueryType.HasValue,
        getComponentById(components, TypeCompID),
        abi.encode(_type)
      );
    }

    return LibQuery.query(fragments);
  }
}
