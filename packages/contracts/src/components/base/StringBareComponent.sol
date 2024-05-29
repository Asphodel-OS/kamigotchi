// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;
import "solecs/BareComponent.sol";
import { TypeLib } from "components/types/standard.sol";

contract StringBareComponent is BareComponent {
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
    values[0] = LibTypes.SchemaValue.STRING;
  }

  function set(uint256 entity, string memory value) external virtual onlyWriter {
    _set(entity, TypeLib.encodeString(value));
  }

  function setBatch(uint256[] memory entities, string[] memory values) external virtual onlyWriter {
    _setBatch(entities, TypeLib.encodeBatch(values));
  }

  function extract(uint256 entity) external virtual onlyWriter returns (string memory) {
    return TypeLib.decodeString(_extractRaw(entity));
  }

  function extractBatch(
    uint256[] memory entities
  ) external virtual onlyWriter returns (string[] memory) {
    return TypeLib.decodeBatchString(_extractRawBatch(entities));
  }

  function get(uint256 entity) external view virtual returns (string memory) {
    return TypeLib.decodeString(_getRaw(entity));
  }

  function getBatch(uint256[] memory entities) external view virtual returns (string[] memory) {
    return TypeLib.decodeBatchString(_getRawBatch(entities));
  }
}
