// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "solecs/Component.sol";

import { Location } from "libraries/LibRoom.sol";

uint256 constant ID = uint256(keccak256("component.location"));

contract LocationComponent is Component {
  constructor(address world) Component(world, ID) {}

  function getSchema()
    public
    pure
    override
    returns (string[] memory keys, LibTypes.SchemaValue[] memory values)
  {
    keys = new string[](3);
    values = new LibTypes.SchemaValue[](3);

    keys[0] = "x";
    values[0] = LibTypes.SchemaValue.INT32;

    keys[1] = "y";
    values[1] = LibTypes.SchemaValue.INT32;

    keys[2] = "z";
    values[2] = LibTypes.SchemaValue.INT32;
  }

  function set(uint256 entity, Location memory value) public onlyWriter {
    set(entity, abi.encode(value));
  }

  function get(uint256 entity) public view virtual returns (Location memory) {
    Location memory value = abi.decode(getRaw(entity), (Location));
    return value;
  }

  function getEntitiesWithValue(
    Location memory value
  ) public view virtual returns (uint256[] memory) {
    return getEntitiesWithValue(abi.encode(value));
  }
}
