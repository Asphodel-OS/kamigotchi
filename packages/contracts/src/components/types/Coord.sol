// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

// voxel coordinates representation
struct Coord {
  int32 x;
  int32 y;
  int32 z;
}

library CoordLib {
  function encode(Coord memory value) internal pure returns (bytes memory) {
    return abi.encode(toUint(value));
  }

  function encodeBatch(Coord[] memory values) internal pure returns (bytes[] memory) {
    bytes[] memory encoded = new bytes[](values.length);
    for (uint256 i = 0; i < values.length; i++) encoded[i] = encode(values[i]);
    return encoded;
  }

  function decode(bytes memory encoded) internal pure returns (Coord memory) {
    return toCoord(abi.decode(encoded, (uint256)));
  }

  function decodeBatch(bytes[] memory encoded) internal pure returns (Coord[] memory) {
    Coord[] memory coords = new Coord[](encoded.length);
    for (uint256 i = 0; i < encoded.length; i++) coords[i] = decode(encoded[i]);
    return coords;
  }

  function toUint(Coord memory value) internal pure returns (uint256) {
    return
      (uint256(uint32(value.x)) << 128) |
      (uint256(uint32(value.y)) << 64) |
      uint256(uint32(value.z));
  }

  function toCoord(uint256 value) internal pure returns (Coord memory) {
    return
      Coord(
        int32(int((value >> 128))),
        int32(int((value >> 64) & 0xFFFFFFFFFFFFFFFF)),
        int32(int((value) & 0xFFFFFFFFFFFFFFFF))
      );
  }
}
