// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;
import "solecs/BareComponent.sol";
import { TypeLib } from "components/types/standard.sol";

/**
 * Reference implementation of a component storing a uint256 value for each entity.
 */
contract Uint256BareComponent is BareComponent {
  constructor(address world, uint256 id) BareComponent(world, id) {}

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

  function set(uint256 entity, uint256 value) external virtual onlyWriter {
    _set(entity, TypeLib.encodeUint256(value));
  }

  function setBatch(
    uint256[] memory entities,
    uint256[] memory values
  ) external virtual onlyWriter {
    _setBatch(entities, TypeLib.encodeBatch(values));
  }

  function extract(uint256 entity) external virtual onlyWriter returns (uint256) {
    return TypeLib.decodeUint256(_extractRaw(entity));
  }

  function extractBatch(
    uint256[] memory entities
  ) external virtual onlyWriter returns (uint256[] memory) {
    return TypeLib.decodeBatchUint256(_extractRawBatch(entities));
  }

  function get(uint256 entity) external view virtual returns (uint256) {
    return TypeLib.decodeUint256(_getRaw(entity));
  }

  function getBatch(uint256[] memory entities) external view virtual returns (uint256[] memory) {
    return TypeLib.decodeBatchUint256(_getRawBatch(entities));
  }
}
