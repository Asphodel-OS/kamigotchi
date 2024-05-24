// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "solecs/Component.sol";

import { Coord, CoordLib } from "components/types/Coord.sol";

contract CoordComponent is Component {
  constructor(address world, uint256 id) Component(world, id) {}

  function getSchema()
    public
    pure
    override
    returns (string[] memory keys, LibTypes.SchemaValue[] memory values)
  {
    keys = new string[](1);
    values = new LibTypes.SchemaValue[](1);

    keys[0] = "value";
    values[0] = LibTypes.SchemaValue.UINT256;
  }

  function set(uint256 entity, Coord memory value) external virtual onlyWriter {
    _set(entity, CoordLib.encode(value));
  }

  function setBatch(uint256[] memory entities, Coord[] memory values) external virtual onlyWriter {
    _setBatch(entities, CoordLib.encodeBatch(values));
  }

  function extract(uint256 entity) external virtual onlyWriter returns (Coord memory) {
    return CoordLib.decode(_extractRaw(entity));
  }

  function extractBatch(
    uint256[] memory entities
  ) external virtual onlyWriter returns (Coord[] memory) {
    return CoordLib.decodeBatch(_extractRawBatch(entities));
  }

  function get(uint256 entity) external view virtual returns (Coord memory) {
    return CoordLib.decode(_getRaw(entity));
  }

  function getBatch(uint256[] memory entities) external view virtual returns (Coord[] memory) {
    return CoordLib.decodeBatch(_getRawBatch(entities));
  }

  function getEntitiesWithValue(
    Coord memory value
  ) external view virtual returns (uint256[] memory) {
    return _getEntitiesWithValue(CoordLib.encode(value));
  }
}
