// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { IComponent as IComp } from "solecs/interfaces/IComponent.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { StatComponent } from "components/base/StatComponent.sol";

import { Stat, StatLib } from "components/types/Stat.sol";

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
    return safeGetString(component, id).eq(str);
  }

  function eqString(
    IComp component,
    uint256[] memory ids,
    string memory str
  ) internal view returns (bool) {
    string[] memory values = safeGetBatchString(component, ids);
    for (uint256 i; i < ids.length; i++) if (!values[i].eq(str)) return false;
    return true;
  }

  /////////////////
  // EXTRACTS

  function safeExtractUint256(IComp component, uint256 entity) internal returns (uint256) {
    bytes memory value = component.extractRaw(entity);
    if (value.length == 0) return 0;
    return abi.decode(value, (uint256));
  }

  function safeExtractUint32(IComp component, uint256 entity) internal returns (uint32) {
    bytes memory value = component.extractRaw(entity);
    if (value.length == 0) return 0;
    return abi.decode(value, (uint32));
  }

  function safeExtractString(IComp component, uint256 entity) internal returns (string memory) {
    bytes memory value = component.extractRaw(entity);
    if (value.length == 0) return "";
    return abi.decode(value, (string));
  }

  function safeextractUint256(
    IComp component,
    uint256[] memory entities
  ) internal returns (uint256[] memory) {
    bytes[] memory values = component.extractRaw(entities);
    uint256[] memory result = new uint256[](values.length);
    for (uint256 i = 0; i < values.length; i++)
      result[i] = values[i].length > 0 ? abi.decode(values[i], (uint256)) : 0;
    return result;
  }

  function safeextractUint32(
    IComp component,
    uint256[] memory entities
  ) internal returns (uint32[] memory) {
    bytes[] memory values = component.extractRaw(entities);
    uint32[] memory result = new uint32[](values.length);
    for (uint256 i = 0; i < values.length; i++)
      result[i] = values[i].length > 0 ? abi.decode(values[i], (uint32)) : 0;
    return result;
  }

  function safeextractString(
    IComp component,
    uint256[] memory entities
  ) internal returns (string[] memory) {
    bytes[] memory values = component.extractRaw(entities);
    string[] memory result = new string[](values.length);
    for (uint256 i = 0; i < values.length; i++)
      result[i] = values[i].length > 0 ? abi.decode(values[i], (string)) : "";
    return result;
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

  function safeGetUint256(IComp component, uint256 entity) internal view returns (uint256) {
    bytes memory value = component.getRaw(entity);
    if (value.length == 0) return 0;
    return abi.decode(value, (uint256));
  }

  function safeGetUint32(IComp component, uint256 entity) internal view returns (uint32) {
    bytes memory value = component.getRaw(entity);
    if (value.length == 0) return 0;
    return abi.decode(value, (uint32));
  }

  function safeGetString(IComp component, uint256 entity) internal view returns (string memory) {
    bytes memory value = component.getRaw(entity);
    if (value.length == 0) return "";
    return abi.decode(value, (string));
  }

  function safeGetStat(StatComponent statComp, uint256 entity) internal view returns (Stat memory) {
    bytes memory value = statComp.getRaw(entity);
    if (value.length == 0) return Stat(0, 0, 0, 0);
    return StatLib.decode(value);
  }

  function safeGetBatchUint256(
    IComp component,
    uint256[] memory entities
  ) internal view returns (uint256[] memory) {
    bytes[] memory values = component.getRaw(entities);
    uint256[] memory result = new uint256[](values.length);
    for (uint256 i = 0; i < values.length; i++)
      result[i] = values[i].length > 0 ? abi.decode(values[i], (uint256)) : 0;
    return result;
  }

  function safeGetBatchUint32(
    IComp component,
    uint256[] memory entities
  ) internal view returns (uint32[] memory) {
    bytes[] memory values = component.getRaw(entities);
    uint32[] memory result = new uint32[](values.length);
    for (uint256 i = 0; i < values.length; i++)
      result[i] = values[i].length > 0 ? abi.decode(values[i], (uint32)) : 0;
    return result;
  }

  function safeGetBatchString(
    IComp component,
    uint256[] memory entities
  ) internal view returns (string[] memory) {
    bytes[] memory values = component.getRaw(entities);
    string[] memory result = new string[](values.length);
    for (uint256 i = 0; i < values.length; i++)
      result[i] = values[i].length > 0 ? abi.decode(values[i], (string)) : "";
    return result;
  }

  function safeGetBatchStat(
    StatComponent statComp,
    uint256[] memory entities
  ) internal view returns (Stat[] memory) {
    bytes[] memory values = statComp.getRaw(entities);
    Stat[] memory result = new Stat[](values.length);
    for (uint256 i = 0; i < values.length; i++)
      result[i] = values[i].length > 0 ? StatLib.decode(values[i]) : Stat(0, 0, 0, 0);
    return result;
  }

  function safeGetTwoUint256(
    IComp component,
    uint256 aID,
    uint256 bID
  ) internal view returns (uint256, uint256) {
    uint256[] memory ids = new uint256[](2);
    ids[0] = aID;
    ids[1] = bID;
    uint256[] memory values = safeGetBatchUint256(component, ids);
    return (values[0], values[1]);
  }

  function safeGetTwoUint32(
    IComp component,
    uint256 aID,
    uint256 bID
  ) internal view returns (uint32, uint32) {
    uint256[] memory ids = new uint256[](2);
    ids[0] = aID;
    ids[1] = bID;
    uint32[] memory values = safeGetBatchUint32(component, ids);
    return (values[0], values[1]);
  }

  function safeGetTwoString(
    IComp component,
    uint256 aID,
    uint256 bID
  ) internal view returns (string memory, string memory) {
    uint256[] memory ids = new uint256[](2);
    ids[0] = aID;
    ids[1] = bID;
    string[] memory values = safeGetBatchString(component, ids);
    return (values[0], values[1]);
  }

  function safeGetTwoStat(
    StatComponent statComp,
    uint256 aID,
    uint256 bID
  ) internal view returns (Stat memory, Stat memory) {
    uint256[] memory ids = new uint256[](2);
    ids[0] = aID;
    ids[1] = bID;
    Stat[] memory values = safeGetBatchStat(statComp, ids);
    return (values[0], values[1]);
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

  function inc(IUintComp component, uint256 id, uint256 amt) internal returns (uint256 val) {
    val = safeGetUint256(component, id) + amt;
    component.set(id, val);
  }

  /// @dev needs to get individually in case of repeated indices
  function incBatch(IUintComp component, uint256[] memory ids, uint256 amt) internal {
    for (uint256 i; i < ids.length; i++) inc(component, ids[i], amt);
  }

  /// @dev needs to get individually in case of repeated indices
  function incBatch(IUintComp component, uint256[] memory ids, uint256[] memory amts) internal {
    for (uint256 i; i < ids.length; i++) inc(component, ids[i], amts[i]);
  }

  function dec(IUintComp component, uint256 id, uint256 amt) internal returns (uint256 val) {
    val = safeGetUint256(component, id) - amt;
    component.set(id, val);
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
