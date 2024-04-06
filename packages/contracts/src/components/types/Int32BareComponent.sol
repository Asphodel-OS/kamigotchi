// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;
import "solecs/BareComponent.sol";

contract Int32BareComponent is BareComponent {
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
    values[0] = LibTypes.SchemaValue.INT32;
  }

  function set(uint256 entity, int32 value) public virtual {
    set(entity, abi.encode(value));
  }

  function setBatch(uint256[] memory entities, int32[] memory values) public virtual {
    bytes[] memory rawValues = new bytes[](entities.length);
    for (uint256 i = 0; i < entities.length; i++) rawValues[i] = abi.encode(values[i]);

    setBatch(entities, rawValues);
  }

  function extract(uint256 entity) public virtual returns (int32) {
    return abi.decode(extractRaw(entity), (int32));
  }

  function extractBatch(uint256[] memory entities) public virtual returns (int32[] memory) {
    bytes[] memory rawValues = extractRawBatch(entities);
    int32[] memory values = new int32[](entities.length);
    for (uint256 i = 0; i < entities.length; i++) values[i] = abi.decode(rawValues[i], (int32));
    return values;
  }

  function get(uint256 entity) public view virtual returns (int32) {
    return abi.decode(getRaw(entity), (int32));
  }

  function getBatch(uint256[] memory entities) public view virtual returns (int32[] memory) {
    bytes[] memory rawValues = getRawBatch(entities);
    int32[] memory values = new int32[](entities.length);
    for (uint256 i = 0; i < entities.length; i++) values[i] = abi.decode(rawValues[i], (int32));
    return values;
  }
}
