// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { QueryFragment, QueryType } from "solecs/interfaces/Query.sol";
import { LibQuery } from "solecs/LibQuery.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

import { ID as AddrOperatorCompID } from "components/AddressOperatorComponent.sol";
import { ID as IsRequestCompID } from "components/IsRequestComponent.sol";
import { ID as IsTradeCompID } from "components/IsTradeComponent.sol";
import { BlockLastComponent, ID as BlockLastCompID } from "components/BlockLastComponent.sol";
import { ID as IsAccountCompID } from "components/IsAccountComponent.sol";
import { LocationComponent, ID as LocCompID } from "components/LocationComponent.sol";
import { StateComponent, ID as StateCompID } from "components/StateComponent.sol";

// maybe keep a bunch of generic component value comparisons in here. seems useful as many
// comparisons seem to be redundant across libraries while others don't have a clear domain
library Utils {
  /////////////////
  // ARCHETYPE CHECKS

  // Check whether an entity is a Request.
  function isRequest(IUintComp components, uint256 id) internal view returns (bool) {
    return _isX(components, IsRequestCompID, id);
  }

  // Check whether an entity is a Trade.
  function isTrade(IUintComp components, uint256 id) internal view returns (bool) {
    return _isX(components, IsTradeCompID, id);
  }

  function _isX(
    IUintComp components,
    uint256 componentID,
    uint256 id
  ) internal view returns (bool) {
    return getComponentById(components, componentID).has(id);
  }

  /////////////////
  // VALUE COMPARISONS

  // Check whether an entity has the specified state.
  function hasState(
    IUintComp components,
    uint256 id,
    string memory state
  ) internal view returns (bool) {
    return StateComponent(getAddressById(components, StateCompID)).hasValue(id, state);
  }

  function sameRoom(IUintComp components, uint256 a, uint256 b) internal view returns (bool) {
    LocationComponent LocC = LocationComponent(getAddressById(components, LocCompID));
    return LocC.getValue(a) == LocC.getValue(b);
  }

  /////////////////
  // COMMON UPDATES

  // Update the BlockLast of an entity. Commonly used for throttling actions on accounts.
  function updateLastBlock(IUintComp components, uint256 id) internal {
    BlockLastComponent(getAddressById(components, BlockLastCompID)).set(id, block.number);
  }

  // QUERIES

  // Get all account entities matching the specified filters.
  function getAccountByAddress(
    IUintComp components,
    address wallet
  ) internal view returns (uint256 result) {
    QueryFragment[] memory fragments = new QueryFragment[](2);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsAccountCompID), "");
    fragments[1] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, AddrOperatorCompID),
      abi.encode(wallet)
    );
    uint256[] memory results = LibQuery.query(fragments);
    if (results.length > 0) {
      result = results[0];
    }
  }
}
