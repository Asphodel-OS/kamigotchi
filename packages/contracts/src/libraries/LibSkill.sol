// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { getAddressById, getComponentById, addressToEntity } from "solecs/utils.sol";

import { SkillPointComponent, ID as SPCompID } from "components/SkillPointComponent.sol";

library LibSkill {
  /////////////////
  // INTERACTIONS

  // increase skill points by a specified value
  function inc(IUintComp components, uint256 id, uint256 value) internal {
    uint256 curr = get(components, id);
    set(components, id, curr + value);
  }

  // decrease skillPoints by a specified value
  function dec(IUintComp components, uint256 id, uint256 value) internal {
    uint256 curr = get(components, id);
    uint256 diff = (curr > value) ? curr - value : 0;
    set(components, id, diff);
  }

  /////////////////
  // CHECKERS

  // check whether an entity has an Experience Component entry
  function has(IUintComp components, uint256 id) internal view returns (bool) {
    return SkillPointComponent(getAddressById(components, SPCompID)).has(id);
  }

  /////////////////
  // SETTERS

  // set the Experience of an entity to the specified value
  function set(IUintComp components, uint256 id, uint256 value) internal {
    SkillPointComponent(getAddressById(components, SPCompID)).set(id, value);
  }

  /////////////////
  // GETTERS

  // get the Experience of an entity, defaults to 0 if not found
  function get(IUintComp components, uint256 id) internal view returns (uint256) {
    if (!has(components, id)) return 0;
    return SkillPointComponent(getAddressById(components, SPCompID)).getValue(id);
  }
}
