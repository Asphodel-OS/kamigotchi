// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;
import "solecs/Component.sol";

contract BoolComponent is Component {
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
    values[0] = LibTypes.SchemaValue.BOOL;
  }

  function set(uint256 entity) public {
    set(entity, abi.encode(true));
  }

  function setBatch(uint256[] memory entities, bool[] memory values) public virtual {
    bytes[] memory rawValues = new bytes[](entities.length);
    for (uint256 i = 0; i < entities.length; i++) rawValues[i] = abi.encode(values[i]);

    setBatch(entities, rawValues);
  }

  function extract(uint256 entity) public virtual returns (bool) {
    return abi.decode(extractRaw(entity), (bool));
  }

  function extractBatch(uint256[] memory entities) public virtual returns (bool[] memory) {
    bytes[] memory rawValues = extractRawBatch(entities);
    bool[] memory values = new bool[](entities.length);
    for (uint256 i = 0; i < entities.length; i++) values[i] = abi.decode(rawValues[i], (bool));
    return values;
  }

  function get(uint256 entity) public view virtual returns (bool) {
    return abi.decode(getRaw(entity), (bool));
  }

  function getBatch(uint256[] memory entities) public view virtual returns (bool[] memory) {
    bytes[] memory rawValues = getRawBatch(entities);
    bool[] memory values = new bool[](entities.length);
    for (uint256 i = 0; i < entities.length; i++) values[i] = abi.decode(rawValues[i], (bool));
    return values;
  }

  function getEntities() public view virtual override returns (uint256[] memory) {
    return getEntitiesWithValue(abi.encode(true));
  }

  function getEntitiesWithValue(bool value) public view virtual returns (uint256[] memory) {
    return getEntitiesWithValue(abi.encode(value));
  }
}
