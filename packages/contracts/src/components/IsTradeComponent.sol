// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;
import "solecs/components/BoolBareComponent.sol";

uint256 constant ID = uint256(keccak256("component.is.trade"));

// TradesTradesTradesTrades
contract IsTradeComponent is BoolBareComponent {
  constructor(address world) BoolBareComponent(world, ID) {}
}
