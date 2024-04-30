// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IComponent as IComp } from "solecs/interfaces/IComponent.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";

/// @notice a library for useful component operations
library LibComp {
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

  function safeExtractBatchUint256(
    IComp component,
    uint256[] memory entities
  ) internal returns (uint256[] memory) {
    bytes[] memory values = component.extractRawBatch(entities);
    uint256[] memory result = new uint256[](values.length);
    for (uint256 i = 0; i < values.length; i++)
      result[i] = values[i].length > 0 ? abi.decode(values[i], (uint256)) : 0;
    return result;
  }

  function safeExtractBatchUint32(
    IComp component,
    uint256[] memory entities
  ) internal returns (uint32[] memory) {
    bytes[] memory values = component.extractRawBatch(entities);
    uint32[] memory result = new uint32[](values.length);
    for (uint256 i = 0; i < values.length; i++)
      result[i] = values[i].length > 0 ? abi.decode(values[i], (uint32)) : 0;
    return result;
  }

  function safeExtractBatchString(
    IComp component,
    uint256[] memory entities
  ) internal returns (string[] memory) {
    bytes[] memory values = component.extractRawBatch(entities);
    string[] memory result = new string[](values.length);
    for (uint256 i = 0; i < values.length; i++)
      result[i] = values[i].length > 0 ? abi.decode(values[i], (string)) : "";
    return result;
  }

  /////////////////
  // GETS

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

  function safeGetBatchUint256(
    IComp component,
    uint256[] memory entities
  ) internal view returns (uint256[] memory) {
    bytes[] memory values = component.getRawBatch(entities);
    uint256[] memory result = new uint256[](values.length);
    for (uint256 i = 0; i < values.length; i++)
      result[i] = values[i].length > 0 ? abi.decode(values[i], (uint256)) : 0;
    return result;
  }

  function safeGetBatchUint32(
    IComp component,
    uint256[] memory entities
  ) internal view returns (uint32[] memory) {
    bytes[] memory values = component.getRawBatch(entities);
    uint32[] memory result = new uint32[](values.length);
    for (uint256 i = 0; i < values.length; i++)
      result[i] = values[i].length > 0 ? abi.decode(values[i], (uint32)) : 0;
    return result;
  }

  function safeGetBatchString(
    IComp component,
    uint256[] memory entities
  ) internal view returns (string[] memory) {
    bytes[] memory values = component.getRawBatch(entities);
    string[] memory result = new string[](values.length);
    for (uint256 i = 0; i < values.length; i++)
      result[i] = values[i].length > 0 ? abi.decode(values[i], (string)) : "";
    return result;
  }

  /////////////////
  // SETS

  function setAll(IComp component, uint256[] memory entities, bytes memory value) internal {
    bytes[] memory values = new bytes[](entities.length);
    for (uint256 i; i < entities.length; i++) values[i] = value;
    component.setBatch(entities, values);
  }

  function setAll(IComp component, uint256[] memory entities, uint256 value) internal {
    bytes[] memory values = new bytes[](entities.length);
    for (uint256 i; i < entities.length; i++) values[i] = abi.encode(value);
    component.setBatch(entities, values);
  }

  function setAll(IComp component, uint256[] memory entities, uint32 value) internal {
    bytes[] memory values = new bytes[](entities.length);
    for (uint256 i; i < entities.length; i++) values[i] = abi.encode(value);
    component.setBatch(entities, values);
  }

  function setAll(IComp component, uint256[] memory entities, string memory value) internal {
    bytes[] memory values = new bytes[](entities.length);
    for (uint256 i; i < entities.length; i++) values[i] = abi.encode(value);
    component.setBatch(entities, values);
  }

  /////////////////
  // CALCS

  function inc(IUintComp component, uint256 id, uint256 amt) internal returns (uint256 val) {
    val = safeGetUint256(component, id) + amt;
    component.set(id, val);
  }

  function dec(IUintComp component, uint256 id, uint256 amt) internal returns (uint256 val) {
    val = safeGetUint256(component, id) - amt;
    component.set(id, val);
  }
}
