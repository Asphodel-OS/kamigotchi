// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "solecs/BareComponent.sol";

import { Location } from "libraries/LibRoom.sol";

uint256 constant ID = uint256(keccak256("component.Exits"));

// list of exits
contract ExitsComponent is BareComponent {
  constructor(address world) BareComponent(world, ID) {}

  function getSchema()
    public
    pure
    override
    returns (string[] memory keys, LibTypes.SchemaValue[] memory values)
  {
    keys = new string[](1);
    values = new LibTypes.SchemaValue[](1);

    // BYTES_ARRAY is used rather than LOCATION_ARRAY – custom struct arrays not supported
    keys[0] = "Location";
    values[0] = LibTypes.SchemaValue.BYTES_ARRAY;
  }

  function set(uint256 entity, Location[] memory value) public {
    set(entity, abi.encode(value));
  }

  function getValue(uint256 entity) public view virtual returns (Location[] memory) {
    Location[] memory value = abi.decode(getRawValue(entity), (Location[]));
    return value;
  }
}
