// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

/// @notice a library to handle the standard solidity types
/// @dev to standardise logic in one place for upgradability and visibility
library TypeLib {
  /////////////////
  // ENCODERS
  /////////////////

  function encodeUint256(uint256 value) internal pure returns (bytes memory) {
    return abi.encode(value);
  }

  function encodeUint32(uint32 value) internal pure returns (bytes memory) {
    return abi.encode(value);
  }

  function encodeInt256(int256 value) internal pure returns (bytes memory) {
    return abi.encode(value);
  }

  function encodeInt32(int32 value) internal pure returns (bytes memory) {
    return abi.encode(value);
  }

  function encodeAddress(address value) internal pure returns (bytes memory) {
    return abi.encode(value);
  }

  function encodeBool(bool value) internal pure returns (bytes memory) {
    return abi.encode(value);
  }

  function encodeString(string memory value) internal pure returns (bytes memory) {
    return abi.encode(value);
  }

  function encodeUint256Array(uint256[] memory value) internal pure returns (bytes memory) {
    return abi.encode(value);
  }

  function encodeUint32Array(uint32[] memory value) internal pure returns (bytes memory) {
    return abi.encode(value);
  }

  function encodeInt32Array(int32[] memory value) internal pure returns (bytes memory) {
    return abi.encode(value);
  }

  function encodeBatch(uint256[] memory values) internal pure returns (bytes[] memory) {
    bytes[] memory encodedVals = new bytes[](values.length);
    for (uint256 i = 0; i < values.length; i++) encodedVals[i] = encodeUint256(values[i]);
    return encodedVals;
  }

  function encodeBatch(uint32[] memory values) internal pure returns (bytes[] memory) {
    bytes[] memory encodedVals = new bytes[](values.length);
    for (uint256 i = 0; i < values.length; i++) encodedVals[i] = encodeUint32(values[i]);
    return encodedVals;
  }

  function encodeBatch(int256[] memory values) internal pure returns (bytes[] memory) {
    bytes[] memory encodedVals = new bytes[](values.length);
    for (uint256 i = 0; i < values.length; i++) encodedVals[i] = encodeInt256(values[i]);
    return encodedVals;
  }

  function encodeBatch(int32[] memory values) internal pure returns (bytes[] memory) {
    bytes[] memory encodedVals = new bytes[](values.length);
    for (uint256 i = 0; i < values.length; i++) encodedVals[i] = encodeInt32(values[i]);
    return encodedVals;
  }

  function encodeBatch(address[] memory values) internal pure returns (bytes[] memory) {
    bytes[] memory encodedVals = new bytes[](values.length);
    for (uint256 i = 0; i < values.length; i++) encodedVals[i] = encodeAddress(values[i]);
    return encodedVals;
  }

  /// @dev for boolean arrays
  function encodeBatch(uint256 length) internal pure returns (bytes[] memory) {
    bytes[] memory encodedVals = new bytes[](length);
    for (uint256 i = 0; i < length; i++) encodedVals[i] = encodeBool(true);
    return encodedVals;
  }

  function encodeBatch(string[] memory values) internal pure returns (bytes[] memory) {
    bytes[] memory encodedVals = new bytes[](values.length);
    for (uint256 i = 0; i < values.length; i++) encodedVals[i] = encodeString(values[i]);
    return encodedVals;
  }

  function encodeBatch(uint256[][] memory values) internal pure returns (bytes[] memory) {
    bytes[] memory encodedVals = new bytes[](values.length);
    for (uint256 i = 0; i < values.length; i++) encodedVals[i] = encodeUint256Array(values[i]);
    return encodedVals;
  }

  function encodeBatch(uint32[][] memory values) internal pure returns (bytes[] memory) {
    bytes[] memory encodedVals = new bytes[](values.length);
    for (uint256 i = 0; i < values.length; i++) encodedVals[i] = encodeUint32Array(values[i]);
    return encodedVals;
  }

  function encodeBatch(int32[][] memory values) internal pure returns (bytes[] memory) {
    bytes[] memory encodedVals = new bytes[](values.length);
    for (uint256 i = 0; i < values.length; i++) encodedVals[i] = encodeInt32Array(values[i]);
    return encodedVals;
  }

  ///////////////
  // DECODERS

  function decodeUint256(bytes memory value) internal pure returns (uint256) {
    return abi.decode(value, (uint256));
  }

  function decodeUint32(bytes memory value) internal pure returns (uint32) {
    return abi.decode(value, (uint32));
  }

  function decodeInt256(bytes memory value) internal pure returns (int256) {
    return abi.decode(value, (int256));
  }

  function decodeInt32(bytes memory value) internal pure returns (int32) {
    return abi.decode(value, (int32));
  }

  function decodeAddress(bytes memory value) internal pure returns (address) {
    return abi.decode(value, (address));
  }

  function decodeBool(bytes memory value) internal pure returns (bool) {
    return abi.decode(value, (bool));
  }

  function decodeString(bytes memory value) internal pure returns (string memory) {
    return abi.decode(value, (string));
  }

  function decodeUint256Array(bytes memory value) internal pure returns (uint256[] memory) {
    return abi.decode(value, (uint256[]));
  }

  function decodeUint32Array(bytes memory value) internal pure returns (uint32[] memory) {
    return abi.decode(value, (uint32[]));
  }

  function decodeInt32Array(bytes memory value) internal pure returns (int32[] memory) {
    return abi.decode(value, (int32[]));
  }

  function decodeBatchUint256(bytes[] memory values) internal pure returns (uint256[] memory) {
    uint256[] memory decodedVals = new uint256[](values.length);
    for (uint256 i = 0; i < values.length; i++) decodedVals[i] = decodeUint256(values[i]);
    return decodedVals;
  }

  function decodeBatchUint32(bytes[] memory values) internal pure returns (uint32[] memory) {
    uint32[] memory decodedVals = new uint32[](values.length);
    for (uint256 i = 0; i < values.length; i++) decodedVals[i] = decodeUint32(values[i]);
    return decodedVals;
  }

  function decodeBatchInt256(bytes[] memory values) internal pure returns (int256[] memory) {
    int256[] memory decodedVals = new int256[](values.length);
    for (uint256 i = 0; i < values.length; i++) decodedVals[i] = decodeInt256(values[i]);
    return decodedVals;
  }

  function decodeBatchInt32(bytes[] memory values) internal pure returns (int32[] memory) {
    int32[] memory decodedVals = new int32[](values.length);
    for (uint256 i = 0; i < values.length; i++) decodedVals[i] = decodeInt32(values[i]);
    return decodedVals;
  }

  function decodeBatchAddress(bytes[] memory values) internal pure returns (address[] memory) {
    address[] memory decodedVals = new address[](values.length);
    for (uint256 i = 0; i < values.length; i++) decodedVals[i] = decodeAddress(values[i]);
    return decodedVals;
  }

  function decodeBatchBool(bytes[] memory values) internal pure returns (bool[] memory) {
    bool[] memory decodedVals = new bool[](values.length);
    for (uint256 i = 0; i < values.length; i++) decodedVals[i] = decodeBool(values[i]);
    return decodedVals;
  }

  function decodeBatchString(bytes[] memory values) internal pure returns (string[] memory) {
    string[] memory decodedVals = new string[](values.length);
    for (uint256 i = 0; i < values.length; i++) decodedVals[i] = decodeString(values[i]);
    return decodedVals;
  }

  function decodeBatchUint256Array(
    bytes[] memory values
  ) internal pure returns (uint256[][] memory) {
    uint256[][] memory decodedVals = new uint256[][](values.length);
    for (uint256 i = 0; i < values.length; i++) decodedVals[i] = decodeUint256Array(values[i]);
    return decodedVals;
  }

  function decodeBatchUint32Array(bytes[] memory values) internal pure returns (uint32[][] memory) {
    uint32[][] memory decodedVals = new uint32[][](values.length);
    for (uint256 i = 0; i < values.length; i++) decodedVals[i] = decodeUint32Array(values[i]);
    return decodedVals;
  }

  function decodeBatchInt32Array(bytes[] memory values) internal pure returns (int32[][] memory) {
    int32[][] memory decodedVals = new int32[][](values.length);
    for (uint256 i = 0; i < values.length; i++) decodedVals[i] = decodeInt32Array(values[i]);
    return decodedVals;
  }

  function safeDecodeUint256(bytes memory value) internal pure returns (uint256) {
    return value.length > 0 ? abi.decode(value, (uint256)) : 0;
  }

  function safeDecodeUint32(bytes memory value) internal pure returns (uint32) {
    return value.length > 0 ? abi.decode(value, (uint32)) : 0;
  }

  function safeDecodeInt256(bytes memory value) internal pure returns (int256) {
    return value.length > 0 ? abi.decode(value, (int256)) : int256(0);
  }

  function safeDecodeInt32(bytes memory value) internal pure returns (int32) {
    return value.length > 0 ? abi.decode(value, (int32)) : int32(0);
  }

  function safeDecodeAddress(bytes memory value) internal pure returns (address) {
    return value.length > 0 ? abi.decode(value, (address)) : address(0);
  }

  function safeDecodeBool(bytes memory value) internal pure returns (bool) {
    return value.length > 0 ? abi.decode(value, (bool)) : false;
  }

  function safeDecodeString(bytes memory value) internal pure returns (string memory) {
    return value.length > 0 ? abi.decode(value, (string)) : "";
  }

  function safeDecodeUint256Array(bytes memory value) internal pure returns (uint256[] memory) {
    return value.length > 0 ? abi.decode(value, (uint256[])) : new uint256[](0);
  }

  function safeDecodeUint32Array(bytes memory value) internal pure returns (uint32[] memory) {
    return value.length > 0 ? abi.decode(value, (uint32[])) : new uint32[](0);
  }

  function safeDecodeInt32Array(bytes memory value) internal pure returns (int32[] memory) {
    return value.length > 0 ? abi.decode(value, (int32[])) : new int32[](0);
  }

  function safeDecodeBatchUint256(bytes[] memory values) internal pure returns (uint256[] memory) {
    uint256[] memory decodedVals = new uint256[](values.length);
    for (uint256 i = 0; i < values.length; i++) decodedVals[i] = safeDecodeUint256(values[i]);
    return decodedVals;
  }

  function safeDecodeBatchUint32(bytes[] memory values) internal pure returns (uint32[] memory) {
    uint32[] memory decodedVals = new uint32[](values.length);
    for (uint256 i = 0; i < values.length; i++) decodedVals[i] = safeDecodeUint32(values[i]);
    return decodedVals;
  }

  function safeDecodeBatchInt256(bytes[] memory values) internal pure returns (int256[] memory) {
    int256[] memory decodedVals = new int256[](values.length);
    for (uint256 i = 0; i < values.length; i++) decodedVals[i] = safeDecodeInt256(values[i]);
    return decodedVals;
  }

  function safeDecodeBatchInt32(bytes[] memory values) internal pure returns (int32[] memory) {
    int32[] memory decodedVals = new int32[](values.length);
    for (uint256 i = 0; i < values.length; i++) decodedVals[i] = safeDecodeInt32(values[i]);
    return decodedVals;
  }

  function safeDecodeBatchAddress(bytes[] memory values) internal pure returns (address[] memory) {
    address[] memory decodedVals = new address[](values.length);
    for (uint256 i = 0; i < values.length; i++) decodedVals[i] = safeDecodeAddress(values[i]);
    return decodedVals;
  }

  function safeDecodeBatchBool(bytes[] memory values) internal pure returns (bool[] memory) {
    bool[] memory decodedVals = new bool[](values.length);
    for (uint256 i = 0; i < values.length; i++) decodedVals[i] = safeDecodeBool(values[i]);
    return decodedVals;
  }

  function safeDecodeBatchString(bytes[] memory values) internal pure returns (string[] memory) {
    string[] memory decodedVals = new string[](values.length);
    for (uint256 i = 0; i < values.length; i++) decodedVals[i] = safeDecodeString(values[i]);
    return decodedVals;
  }

  function safeDecodeBatchUint256Array(
    bytes[] memory values
  ) internal pure returns (uint256[][] memory) {
    uint256[][] memory decodedVals = new uint256[][](values.length);
    for (uint256 i = 0; i < values.length; i++) decodedVals[i] = safeDecodeUint256Array(values[i]);
    return decodedVals;
  }

  function safeDecodeBatchUint32Array(
    bytes[] memory values
  ) internal pure returns (uint32[][] memory) {
    uint32[][] memory decodedVals = new uint32[][](values.length);
    for (uint256 i = 0; i < values.length; i++) decodedVals[i] = safeDecodeUint32Array(values[i]);
    return decodedVals;
  }

  function safeDecodeBatchInt32Array(
    bytes[] memory values
  ) internal pure returns (int32[][] memory) {
    int32[][] memory decodedVals = new int32[][](values.length);
    for (uint256 i = 0; i < values.length; i++) decodedVals[i] = safeDecodeInt32Array(values[i]);
    return decodedVals;
  }
}
