// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;
import "solecs/Component.sol";

import { Coord, CoordLib } from "solecs/components/types/Coord.sol";

contract CoordComponent is Component {
  constructor(address world, uint256 id) Component(world, id) {}

  function set(uint256 entity, Coord memory value) external virtual onlyWriter {
    _set(entity, CoordLib.encode(value));
  }

  function set(uint256[] memory entities, Coord[] memory values) external virtual onlyWriter {
    _set(entities, CoordLib.encodeBatch(values));
  }

  function extract(uint256 entity) external virtual onlyWriter returns (Coord memory) {
    return CoordLib.decode(_extractRaw(entity));
  }

  function extract(uint256[] memory entities) external virtual onlyWriter returns (Coord[] memory) {
    return CoordLib.decodeBatch(_extractRaw(entities));
  }

  function get(uint256 entity) external view virtual returns (Coord memory) {
    return CoordLib.decode(_getRaw(entity));
  }

  function get(uint256[] memory entities) external view virtual returns (Coord[] memory) {
    return CoordLib.decodeBatch(_getRaw(entities));
  }

  function safeGet(uint256 entity) external view virtual returns (Coord memory) {
    return CoordLib.safeDecode(_getRaw(entity));
  }

  function safeGet(uint256[] memory entities) external view virtual returns (Coord[] memory) {
    return CoordLib.safeDecodeBatch(_getRaw(entities));
  }

  function getEntitiesWithValue(
    Coord memory value
  ) external view virtual returns (uint256[] memory) {
    return _getEntitiesWithValue(CoordLib.encode(value));
  }
}
