// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "solecs/Component.sol";

uint256 constant ID = uint256(keccak256("component.Timelock"));

struct TimelockOp {
  address target;
  uint256 value;
  uint256 salt;
}

contract TimelockComponent is Component {
  constructor(address world) Component(world, ID) {}

  function getSchema()
    public
    pure
    override
    returns (string[] memory keys, LibTypes.SchemaValue[] memory values)
  {
    keys = new string[](3);
    values = new LibTypes.SchemaValue[](3);

    keys[0] = "target";
    values[0] = LibTypes.SchemaValue.ADDRESS;

    keys[1] = "value";
    values[1] = LibTypes.SchemaValue.UINT256;

    keys[2] = "salt";
    values[2] = LibTypes.SchemaValue.UINT256;
  }

  function set(uint256 entity, TimelockOp memory value) public {
    set(entity, abi.encode(value));
  }

  function get(uint256 entity) public view virtual returns (TimelockOp memory) {
    TimelockOp memory value = abi.decode(getRaw(entity), (TimelockOp));
    return value;
  }

  function getEntitiesWithValue(
    TimelockOp memory value
  ) public view virtual returns (uint256[] memory) {
    return getEntitiesWithValue(abi.encode(value));
  }
}
