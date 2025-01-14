// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;
import "solecs/components/ProxyComponent.sol";

import { VipScore } from "initia-vip/VipScore.sol";

uint256 constant ID = uint256(keccak256("component.proxy.vip.score"));

contract ProxyVIPScoreComponent is ProxyComponent {
  constructor(address world) ProxyComponent(world, ID) {}

  /// @notice permissioned call to increase score
  function inc(
    address scorer,
    uint64 stage,
    address accAddr,
    uint64 amount
  ) external onlyWriter isUnfrozen {
    VipScore(scorer).increaseScore(stage, accAddr, amount);
  }
}
