// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import "./Imports.sol";
import { console } from "forge-std/console.sol";

/// @notice deploys erc20 and erc721 token contracts
/// @dev assumes ValueComp is registered. This is only expected to be called during initial world setup
library LibDeployTokens {
  function deployKami721(IWorld world, IUint256Component components) internal returns (address) {
    require(!LibConfig.has(components, "KAMI721_ADDRESS"), "pet721 already deployed");

    Kami721 pet721 = new Kami721(world, "Kamigotchi", "KAMI");
    LibConfig.setAddress(components, "KAMI721_ADDRESS", address(pet721));

    console.log("KAMI721_ADDRESS: ", address(pet721));
    return address(pet721);
  }

  /// @notice deploys and writes permissions for score contract for initia VIP
  function deployVIP(IWorld world, IUint256Component components) internal returns (address) {
    require(!LibConfig.has(components, "VIP_SCORE_ADDRESS"), "vip score already deployed");

    VipScore vipScore = new VipScore();
    LibConfig.setAddress(components, "VIP_SCORE_ADDRESS", address(vipScore));

    // set permissions for proxy contract
    vipScore.addAllowList(getAddrByID(components, ProxyVIPScoreComponentID));

    console.log("VIP_SCORE_ADDRESS: ", address(vipScore));
    return address(vipScore);
  }
}
