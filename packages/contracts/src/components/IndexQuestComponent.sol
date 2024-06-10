// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "components/base/Uint32BareComponent.sol";

uint256 constant ID = uint256(keccak256("component.index.quest"));

contract IndexQuestComponent is Uint32BareComponent {
  constructor(address world) Uint32BareComponent(world, ID) {}
}
