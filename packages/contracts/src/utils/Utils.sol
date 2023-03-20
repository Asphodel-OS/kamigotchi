// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { QueryFragment, QueryType } from "solecs/interfaces/Query.sol";
import { LibQuery } from "solecs/LibQuery.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

import { ID as IsRequestCompID } from "components/IsRequestComponent.sol";
import { StateComponent, ID as StateCompID } from "components/StateComponent.sol";

// maybe keep a bunch of generic component value comparisons in here. seems useful as many
// comparisons seem to be redundant across libraries while others don't have a clear domain
library Utils {
  /////////////////
  // ARCHETYPE CHECKS

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
}
