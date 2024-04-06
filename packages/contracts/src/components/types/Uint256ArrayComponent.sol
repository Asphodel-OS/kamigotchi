// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;
import "solecs/Component.sol";

contract Uint256ArrayComponent is Component {
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
    values[0] = LibTypes.SchemaValue.UINT256_ARRAY;
  }

  function set(uint256 entity, uint256[] memory value) public virtual {
    set(entity, abi.encode(value));
  }

  function setBatch(uint256[] memory entities, uint256[][] memory values) public virtual {
    bytes[] memory rawValues = new bytes[](entities.length);
    for (uint256 i = 0; i < entities.length; i++) rawValues[i] = abi.encode(values[i]);

    setBatch(entities, rawValues);
  }

  function extract(uint256 entity) public virtual returns (uint256[] memory) {
    return abi.decode(extractRaw(entity), (uint256[]));
  }

  function extractBatch(uint256[] memory entities) public virtual returns (uint256[][] memory) {
    bytes[] memory rawValues = extractRawBatch(entities);
    uint256[][] memory values = new uint256[][](entities.length);
    for (uint256 i = 0; i < entities.length; i++) values[i] = abi.decode(rawValues[i], (uint256[]));
    return values;
  }

  function get(uint256 entity) public view virtual returns (uint256[] memory) {
    return abi.decode(getRaw(entity), (uint256[]));
  }

  function getBatch(uint256[] memory entities) public view virtual returns (uint256[][] memory) {
    bytes[] memory rawValues = getRawBatch(entities);
    uint256[][] memory values = new uint256[][](entities.length);
    for (uint256 i = 0; i < entities.length; i++) values[i] = abi.decode(rawValues[i], (uint256[]));
    return values;
  }

  function getEntitiesWithValue(uint256 value) public view virtual returns (uint256[] memory) {
    return getEntitiesWithValue(abi.encode(value));
  }
}
