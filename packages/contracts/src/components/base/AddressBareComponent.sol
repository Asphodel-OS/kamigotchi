// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;
import "solecs/BareComponent.sol";
import { TypeLib } from "components/types/standard.sol";

contract AddressBareComponent is BareComponent {
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

  function set(uint256 entity, address value) external virtual onlyWriter {
    _set(entity, TypeLib.encodeAddress(value));
  }

  function setBatch(
    uint256[] memory entities,
    address[] memory values
  ) external virtual onlyWriter {
    _setBatch(entities, TypeLib.encodeBatch(values));
  }

  function extract(uint256 entity) external virtual onlyWriter returns (address) {
    return TypeLib.decodeAddress(_extractRaw(entity));
  }

  function extractBatch(
    uint256[] memory entities
  ) external virtual onlyWriter returns (address[] memory) {
    return TypeLib.decodeBatchAddress(_extractRawBatch(entities));
  }

  function get(uint256 entity) external view virtual returns (address) {
    return TypeLib.decodeAddress(_getRaw(entity));
  }

  function getBatch(uint256[] memory entities) external view virtual returns (address[] memory) {
    return TypeLib.decodeBatchAddress(_getRawBatch(entities));
  }
}
