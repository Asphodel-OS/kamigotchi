// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component as IComponents } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { QueryFragment, QueryType } from "solecs/interfaces/Query.sol";
import { LibQuery } from "solecs/LibQuery.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

import { IdOperatorComponent, ID as IdOperatorCompID } from "components/IdOperatorComponent.sol";
import { IdRequesteeComponent, ID as IdReqeeCompID } from "components/IdRequesteeComponent.sol";
import { IdRequesterComponent, ID as IdReqerCompID } from "components/IdRequesterComponent.sol";
import { IsRequestComponent, ID as IsRequestCompID } from "components/IsRequestComponent.sol";
import { IsTradeComponent, ID as IsTradeCompID } from "components/IsTradeComponent.sol";
import { StateComponent, ID as StateCompID } from "components/StateComponent.sol";
import { LibRegister } from "libraries/LibRegister.sol";
import { Strings } from "utils/Strings.sol";
import { Utils } from "utils/Utils.sol";

// @dev State = [ INITIATED | ACCEPTED | CONFIRMED | CANCELED ]
library LibTrade {
  /////////////////
  // INTERACTIONS

  // Create a trade and set initial values.
  function create(
    IWorld world,
    IComponents components,
    uint256 aliceID,
    uint256 bobID
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    IsTradeComponent(getAddressById(components, IsTradeCompID)).set(id);
    IsRequestComponent(getAddressById(components, IsRequestCompID)).set(id);
    IdRequesteeComponent(getAddressById(components, IdReqeeCompID)).set(id, aliceID);
    IdRequesterComponent(getAddressById(components, IdReqerCompID)).set(id, bobID);
    StateComponent(getAddressById(components, StateCompID)).set(id, string("INITIATED"));
    return id;
  }

  // Accept the trade and create a register for both parties
  function accept(
    IWorld world,
    IComponents components,
    uint256 id
  ) internal {
    IsRequestComponent(getAddressById(components, IsRequestCompID)).remove(id);
    StateComponent(getAddressById(components, StateCompID)).set(id, string("ACCEPTED"));

    uint256 aliceID = IdRequesteeComponent(getAddressById(components, IdReqeeCompID)).getValue(id);
    uint256 bobID = IdRequesterComponent(getAddressById(components, IdReqerCompID)).getValue(id);
    LibRegister.create(world, components, aliceID, id);
    LibRegister.create(world, components, bobID, id);
  }

  // Cancel an existing trade. World required bc LibRegister.reverse calls LibRegister.process
  function cancel(
    IWorld world,
    IComponents components,
    uint256 id
  ) internal {
    StateComponent(getAddressById(components, StateCompID)).set(id, string("CANCELED"));

    // Check whether it's just a request. If so, no registers have been created.
    IsRequestComponent IsRequestC = IsRequestComponent(getAddressById(components, IsRequestCompID));
    if (IsRequestC.has(id)) {
      IsRequestC.remove(id);
      return;
    }

    // reverse the registers
    uint256[] memory registerIDs = getRegisters(components, id);
    for (uint256 i; i < registerIDs.length; i++) {
      LibRegister.reverse(world, components, registerIDs[i]);
      LibRegister.cancel(components, registerIDs[i]);
    }
  }

  // Process a trade upon confirmation from both parties
  // TODO(jb): ? delete all the created inventory components
  function process(
    IWorld world,
    IComponents components,
    uint256 id
  ) internal returns (bool) {
    uint256 requesterID = getRequestee(components, id);
    uint256 requesteeID = getRequester(components, id);
    uint256 requesterRegisterID = LibRegister.get(components, requesterID, id);
    uint256 requesteeRegisterID = LibRegister.get(components, requesteeID, id);
    LibRegister.process(world, components, requesterRegisterID, false);
    LibRegister.process(world, components, requesteeRegisterID, false);
    StateComponent(getAddressById(components, StateCompID)).set(id, string("COMPLETE"));
    return true;
  }

  /////////////////
  // CHECKS

  // Check whether an operator is the requester or requestee in a trade.
  function hasParticipant(
    IComponents components,
    uint256 id,
    uint256 entityID
  ) internal view returns (bool) {
    return getRequester(components, id) == entityID || getRequestee(components, id) == entityID;
  }

  // Check whether a trade has the specified state.
  function hasState(
    IComponents components,
    uint256 id,
    string memory state
  ) internal view returns (bool) {
    return StateComponent(getAddressById(components, StateCompID)).hasValue(id, state);
  }

  // Check whether a trade is confirmed by both parties. Assumes exactly 2 parties
  function isDoubleConfirmed(IComponents components, uint256 id) internal view returns (bool) {
    uint256[] memory registers = LibTrade.getRegisters(components, id);
    return
      Utils.hasState(components, registers[0], "CONFIRMED") &&
      Utils.hasState(components, registers[1], "CONFIRMED");
  }

  /////////////////
  // COMPONENT RETRIEVAL

  function getRequestee(IComponents components, uint256 id) internal view returns (uint256) {
    return IdRequesteeComponent(getAddressById(components, IdReqeeCompID)).getValue(id);
  }

  function getRequester(IComponents components, uint256 id) internal view returns (uint256) {
    return IdRequesterComponent(getAddressById(components, IdReqerCompID)).getValue(id);
  }

  /////////////////
  // QUERIES

  // Gets active trade request Alice => Bob. Identified by IsTrade, INITIATED. Assume only 1.
  function getRequest(
    IComponents components,
    uint256 aliceID,
    uint256 bobID
  ) internal view returns (uint256 result) {
    uint256[] memory results = _getAllX(components, aliceID, bobID, "INITIATED");
    if (results.length != 0) {
      result = results[0];
    }
  }

  // get the registers of this trade entity
  function getRegisters(IComponents components, uint256 id)
    internal
    view
    returns (uint256[] memory)
  {
    return LibRegister._getAllX(components, 0, id, "");
  }

  // Retrieves all trades based on any defined filters. Doesn't include IsRequest filter
  // as that's redundant to the State filter (STATE == "INITIATED").
  function _getAllX(
    IComponents components,
    uint256 aliceID,
    uint256 bobID,
    string memory state
  ) internal view returns (uint256[] memory) {
    uint256 numFilters;
    if (aliceID != 0) numFilters++;
    if (bobID != 0) numFilters++;
    if (!Strings.equal(state, "")) numFilters++;

    QueryFragment[] memory fragments = new QueryFragment[](numFilters + 1);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsTradeCompID), "");

    uint256 filterCount;
    if (aliceID != 0) {
      fragments[++filterCount] = QueryFragment(
        QueryType.HasValue,
        getComponentById(components, IdReqerCompID),
        abi.encode(aliceID)
      );
    }
    if (bobID != 0) {
      fragments[++filterCount] = QueryFragment(
        QueryType.HasValue,
        getComponentById(components, IdReqeeCompID),
        abi.encode(bobID)
      );
    }
    if (!Strings.equal(state, "")) {
      fragments[++filterCount] = QueryFragment(
        QueryType.HasValue,
        getComponentById(components, StateCompID),
        abi.encode(state)
      );
    }

    return LibQuery.query(fragments);
  }
}
