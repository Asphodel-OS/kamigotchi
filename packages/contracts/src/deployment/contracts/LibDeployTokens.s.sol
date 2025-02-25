// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import "./Imports.sol";
import { console } from "forge-std/console.sol";
import { PreAsset } from "tokens/PreAsset.sol";

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

  /// @dev only for local, to simulate an ERC20. Real onyx is not deployed via this script
  function deployOnyx20Local(
    IWorld world,
    IUint256Component components,
    address deployer
  ) internal returns (address) {
    require(!LibConfig.has(components, "ONYX_ADDRESS"), "onyx already deployed");

    OpenMintable onyx = new OpenMintable("Onyx", "ONYX");
    LibConfig.setAddress(components, "ONYX_ADDRESS", address(onyx));

    // minting onyx to deployer
    onyx.mint(deployer, 1000 ether);

    console.log("ONYX_ADDRESS: ", address(onyx));
    return address(onyx);
  }

  /// @dev only for local, simulates ONYX presale
  function deployPresale(IWorld world, IUint256Component components) internal returns (address) {
    PreAsset presale = new PreAsset();
    LibConfig.setAddress(components, "ONYX_PRESALE_ADDRESS", address(presale));

    console.log("ONYX_PRESALE_ADDRESS: ", address(presale));
    return address(presale);
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
