// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { IComponent as IComp } from "solecs/interfaces/IComponent.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { StatComponent } from "solecs/components/StatComponent.sol";

import { Stat, StatLib } from "solecs/components/types/Stat.sol";

/// @notice a library for useful component operations
library LibComp {
  using LibString for string;

  /////////////////
  // CHECKS

  function allHave(IComp component, uint256[] memory ids, bool has) internal view returns (bool) {
    bool[] memory results = hasBatch(component, ids);
    for (uint256 i; i < ids.length; i++) if (results[i] == !has) return false;
    return true;
  }

  function eqString(IComp component, uint256 id, string memory str) internal view returns (bool) {
    return component.equal(id, abi.encode(str));
  }

  function eqString(
    IComp component,
    uint256[] memory ids,
    string memory str
  ) internal view returns (bool) {
    return component.equal(ids, abi.encode(str));
  }

  /////////////////
  // GETS

  function hasBatch(
    IComp component,
    uint256[] memory entities
  ) internal view returns (bool[] memory) {
    bytes[] memory values = component.getRaw(entities);
    bool[] memory result = new bool[](values.length);
    for (uint256 i = 0; i < entities.length; i++) result[i] = values[i].length > 0;
    return result;
  }

  /////////////////
  // SETS

  function setAll(IComp component, uint256[] memory entities, bytes memory value) internal {
    bytes[] memory values = new bytes[](entities.length);
    for (uint256 i; i < entities.length; i++) values[i] = value;
    component.set(entities, values);
  }

  function setAll(IComp component, uint256[] memory entities, uint256 value) internal {
    bytes[] memory values = new bytes[](entities.length);
    for (uint256 i; i < entities.length; i++) values[i] = abi.encode(value);
    component.set(entities, values);
  }

  function setAll(IComp component, uint256[] memory entities, uint32 value) internal {
    bytes[] memory values = new bytes[](entities.length);
    for (uint256 i; i < entities.length; i++) values[i] = abi.encode(value);
    component.set(entities, values);
  }

  function setAll(IComp component, uint256[] memory entities, string memory value) internal {
    bytes[] memory values = new bytes[](entities.length);
    for (uint256 i; i < entities.length; i++) values[i] = abi.encode(value);
    component.set(entities, values);
  }

  /////////////////
  // CALCS

  function inc(IUintComp component, uint256 id, uint256 amt) internal {
    component.set(id, component.safeGet(id) + amt);
  }

  /// @dev needs to get individually in case of repeated indices
  function incBatch(IUintComp component, uint256[] memory ids, uint256 amt) internal {
    for (uint256 i; i < ids.length; i++) inc(component, ids[i], amt);
  }

  /// @dev needs to get individually in case of repeated indices
  function incBatch(IUintComp component, uint256[] memory ids, uint256[] memory amts) internal {
    for (uint256 i; i < ids.length; i++) inc(component, ids[i], amts[i]);
  }

  function dec(IUintComp component, uint256 id, uint256 amt) internal {
    component.set(id, component.safeGet(id) - amt);
  }

  /// @dev needs to get individually in case of repeated indices
  function decBatch(IUintComp component, uint256[] memory ids, uint256 amt) internal {
    for (uint256 i; i < ids.length; i++) dec(component, ids[i], amt);
  }

  /// @dev needs to get individually in case of repeated indices
  function decBatch(IUintComp component, uint256[] memory ids, uint256[] memory amts) internal {
    for (uint256 i; i < ids.length; i++) dec(component, ids[i], amts[i]);
  }
}
