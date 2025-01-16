// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { IComponent } from "solecs/interfaces/IComponent.sol";
import { LibQuery, QueryFragment, QueryType } from "solecs/LibQuery.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";

import { IdRequesteeComponent, ID as IdReqeeCompID } from "components/IdRequesteeComponent.sol";
import { IdRequesterComponent, ID as IdReqerCompID } from "components/IdRequesterComponent.sol";
import { IsRequestComponent, ID as IsRequestCompID } from "components/IsRequestComponent.sol";
import { IsTradeComponent, ID as IsTradeCompID } from "components/IsTradeComponent.sol";
import { StateComponent, ID as StateCompID } from "components/StateComponent.sol";

import { LibComp } from "libraries/utils/LibComp.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibRegister } from "libraries/LibRegister.sol";
import { Strings } from "utils/Strings.sol";

// @dev State = [ INITIATED | ACCEPTED | CONFIRMED | CANCELED ]
library LibTrade {
  using LibComp for IComponent;
  /////////////////
  // INTERACTIONS

  // Create a trade and set initial values.
  function create(
    IWorld world,
    IUintComp components,
    uint256 aliceID,
    uint256 bobID
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    IsTradeComponent(getAddrByID(components, IsTradeCompID)).set(id);
    IsRequestComponent(getAddrByID(components, IsRequestCompID)).set(id);
    IdRequesteeComponent(getAddrByID(components, IdReqeeCompID)).set(id, aliceID);
    IdRequesterComponent(getAddrByID(components, IdReqerCompID)).set(id, bobID);
    StateComponent(getAddrByID(components, StateCompID)).set(id, string("INITIATED"));
    return id;
  }

  // Accept the trade and create a register for both parties
  function accept(IWorld world, IUintComp components, uint256 id) internal {
    IsRequestComponent(getAddrByID(components, IsRequestCompID)).remove(id);
    StateComponent(getAddrByID(components, StateCompID)).set(id, string("ACCEPTED"));

    uint256 aliceID = IdRequesteeComponent(getAddrByID(components, IdReqeeCompID)).get(id);
    uint256 bobID = IdRequesterComponent(getAddrByID(components, IdReqerCompID)).get(id);
    LibRegister.create(world, components, aliceID, id);
    LibRegister.create(world, components, bobID, id);
  }

  // Cancel an existing trade. World required bc LibRegister.reverse calls LibRegister.process
  function cancel(IUintComp components, uint256 id) internal {
    StateComponent(getAddrByID(components, StateCompID)).set(id, string("CANCELED"));

    // Check whether it's just a request. If so, no registers have been created.
    IsRequestComponent comp = IsRequestComponent(getAddrByID(components, IsRequestCompID));
    if (comp.has(id)) {
      comp.remove(id);
      return;
    }

    // reverse the registers
    uint256[] memory registerIDs = getRegisters(components, id);
    for (uint256 i; i < registerIDs.length; i++) {
      LibRegister.reverse(components, registerIDs[i]);
      LibRegister.cancel(components, registerIDs[i]);
    }
  }

  // Process a trade upon confirmation from both parties
  // TODO(jb): ? delete all the created inventory components
  function process(IUintComp components, uint256 id) internal returns (bool) {
    uint256 requesterID = getRequestee(components, id);
    uint256 requesteeID = getRequester(components, id);
    uint256 requesterRegisterID = LibRegister.get(components, requesterID, id);
    uint256 requesteeRegisterID = LibRegister.get(components, requesteeID, id);
    LibRegister.process(components, requesterRegisterID, false);
    LibRegister.process(components, requesteeRegisterID, false);
    StateComponent(getAddrByID(components, StateCompID)).set(id, string("COMPLETE"));
    return true;
  }

  /////////////////
  // CHECKERS

  // Check whether two parties can interact in a trade with one another
  function canTrade(IUintComp components, uint256 aID, uint256 bID) internal view returns (bool) {
    return LibAccount.getRoom(components, aID) == LibAccount.getRoom(components, bID);
  }

  // Check whether an account is the requester or requestee in a trade.
  function hasParticipant(
    IUintComp components,
    uint256 id,
    uint256 entityID
  ) internal view returns (bool) {
    return getRequester(components, id) == entityID || getRequestee(components, id) == entityID;
  }

  // Check whether a trade has the specified state.
  function hasState(
    IUintComp components,
    uint256 id,
    string memory state
  ) internal view returns (bool) {
    return getCompByID(components, StateCompID).eqString(id, state);
  }

  // Check whether a trade is confirmed by both parties. Assumes exactly 2 parties
  function isDoubleConfirmed(IUintComp components, uint256 id) internal view returns (bool) {
    uint256[] memory registers = LibTrade.getRegisters(components, id);
    return
      hasState(components, registers[0], "CONFIRMED") &&
      hasState(components, registers[1], "CONFIRMED");
  }

  function isRequest(IUintComp components, uint256 id) internal view returns (bool) {
    return IsRequestComponent(getAddrByID(components, IsRequestCompID)).has(id);
  }

  function isTrade(IUintComp components, uint256 id) internal view returns (bool) {
    return IsTradeComponent(getAddrByID(components, IsTradeCompID)).has(id);
  }

  /////////////////
  // GETTERS

  function getRequestee(IUintComp components, uint256 id) internal view returns (uint256) {
    return IdRequesteeComponent(getAddrByID(components, IdReqeeCompID)).get(id);
  }

  function getRequester(IUintComp components, uint256 id) internal view returns (uint256) {
    return IdRequesterComponent(getAddrByID(components, IdReqerCompID)).get(id);
  }

  /////////////////
  // QUERIES

  // Gets active trade request Alice => Bob. Identified by IsTrade, INITIATED. Assume only 1.
  function getRequest(
    IUintComp components,
    uint256 aliceID,
    uint256 bobID
  ) internal view returns (uint256 result) {
    uint256[] memory results = _getAllX(components, aliceID, bobID, "INITIATED");
    if (results.length != 0) {
      result = results[0];
    }
  }

  // get the registers of this trade entity
  function getRegisters(IUintComp components, uint256 id) internal view returns (uint256[] memory) {
    return LibRegister._getAllX(components, 0, id, "");
  }

  // Retrieves all trades based on any defined filters. Doesn't include IsRequest filter
  // as that's redundant to the State filter (STATE == "INITIATED").
  function _getAllX(
    IUintComp components,
    uint256 aliceID,
    uint256 bobID,
    string memory state
  ) internal view returns (uint256[] memory) {
    uint256 numFilters;
    if (aliceID != 0) numFilters++;
    if (bobID != 0) numFilters++;
    if (!Strings.equal(state, "")) numFilters++;

    QueryFragment[] memory fragments = new QueryFragment[](numFilters + 1);

    uint256 filterCount;
    if (aliceID != 0) {
      fragments[filterCount++] = QueryFragment(
        QueryType.HasValue,
        getCompByID(components, IdReqerCompID),
        abi.encode(aliceID)
      );
    }
    if (bobID != 0) {
      fragments[filterCount++] = QueryFragment(
        QueryType.HasValue,
        getCompByID(components, IdReqeeCompID),
        abi.encode(bobID)
      );
    }
    if (!Strings.equal(state, "")) {
      fragments[filterCount++] = QueryFragment(
        QueryType.HasValue,
        getCompByID(components, StateCompID),
        abi.encode(state)
      );
    }
    fragments[filterCount] = QueryFragment(
      QueryType.Has,
      getCompByID(components, IsTradeCompID),
      ""
    );

    return LibQuery.query(fragments);
  }
}
