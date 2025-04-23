// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;
import "solecs/Component.sol";

uint256 constant ID = uint256(keccak256("component.Timelock"));

struct TimelockOp {
  address target;
  uint256 value;
  uint256 salt;
}

contract TimelockComponent is Component {
  constructor(address world) Component(world, ID) {}

  function set(uint256 entity, TimelockOp memory value) public {
    _set(entity, abi.encode(value));
  }

  function get(uint256 entity) public view virtual returns (TimelockOp memory) {
    TimelockOp memory value = abi.decode(_getRaw(entity), (TimelockOp));
    return value;
  }

  function getEntitiesWithValue(
    TimelockOp memory value
  ) public view virtual returns (uint256[] memory) {
    return _getEntitiesWithValue(abi.encode(value));
  }
}
