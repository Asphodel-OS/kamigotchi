// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "components/types/Uint256Component.sol";

uint256 constant ID = uint256(keccak256("component.value"));

// function getComp(Uint256Component comp) internal pure returns (ValueComponent) {
//   return ValueComponent(getAddressById(comp, ValueCompID));
// }

// arbitrary value of a  thing , dependent on context
contract ValueComponent is Uint256Component {
  constructor(address world) Uint256Component(world, ID) {}
}
