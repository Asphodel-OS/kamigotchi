// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID } from "solecs/utils.sol";

import { IdHolderComponent, ID as HolderCompID } from "components/IdHolderComponent.sol";
import { TimelockComponent, ID as TimelockCompID, TimelockOp } from "components/TimelockComponent.sol";

/// @notice library that handles MUD side timelock and other controlled bridge logic
library LibTimelock {
  ////////////////////////
  // INTERACTIONS

  /// @notice stores an instance of a timelock operation
  function create(
    IWorld world,
    IUintComp components,
    uint256 holderID,
    address target,
    uint256 value,
    uint256 salt
  ) internal returns (uint256 id) {
    id = world.getUniqueEntityId();
    setHolder(components, id, holderID);
    setTimelock(components, id, target, value, salt);
  }

  /// @notice removes an instance of a timelock operation
  function unset(IUintComp components, uint256 id) internal {
    unsetHolder(components, id);
    unsetTimelock(components, id);
  }

  ///////////////////////
  // SETTERS

  function setHolder(IUintComp components, uint256 id, uint256 holderID) internal {
    IdHolderComponent(getAddrByID(components, HolderCompID)).set(id, holderID);
  }

  function setTimelock(
    IUintComp components,
    uint256 id,
    address target,
    uint256 value,
    uint256 salt
  ) internal {
    TimelockComponent(getAddrByID(components, TimelockCompID)).set(
      id,
      TimelockOp(target, value, salt)
    );
  }

  function unsetHolder(IUintComp components, uint256 id) internal {
    IdHolderComponent(getAddrByID(components, HolderCompID)).remove(id);
  }

  function unsetTimelock(IUintComp components, uint256 id) internal {
    TimelockComponent(getAddrByID(components, TimelockCompID)).remove(id);
  }

  ///////////////////////
  // GETTERS

  function getTimelock(
    IUintComp components,
    uint256 id
  ) internal view returns (address, uint256, uint256) {
    TimelockOp memory tlo = TimelockComponent(getAddrByID(components, TimelockCompID)).get(id);
    return (tlo.target, tlo.value, tlo.salt);
  }
}
