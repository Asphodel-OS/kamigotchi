// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;
import "solecs/BareComponent.sol";
import { TypeLib } from "components/types/standard.sol";

contract BoolBareComponent is BareComponent {
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
    values[0] = LibTypes.SchemaValue.BOOL;
  }

  function set(uint256 entity) external virtual onlyWriter {
    _set(entity, TypeLib.encodeBool(true));
  }

  function setBatch(uint256[] memory entities) external virtual onlyWriter {
    _setBatch(entities, TypeLib.encodeBatch(entities.length));
  }

  function extract(uint256 entity) external virtual onlyWriter returns (bool) {
    return TypeLib.decodeBool(_extractRaw(entity));
  }

  function extractBatch(
    uint256[] memory entities
  ) external virtual onlyWriter returns (bool[] memory) {
    return TypeLib.decodeBatchBool(_extractRawBatch(entities));
  }

  function get(uint256 entity) external view virtual returns (bool) {
    return has(entity);
  }

  function getBatch(uint256[] memory entities) external view virtual returns (bool[] memory) {
    return TypeLib.decodeBatchBool(_getRawBatch(entities));
  }
}
