// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Imports.sol";
import { console } from "forge-std/console.sol";

/// @notice deploys erc20 and erc721 token contracts
/// @dev assumes ValueComp is registered. This is only expected to be called during initial world setup
library LibDeployTokens {
  function deployKami721(IWorld world, IUint256Component components) internal returns (address) {
    require(!LibConfig.has(components, "KAMI721_ADDRESS"), "pet721 already deployed");

    Kami721 pet721 = new Kami721(world, "Kamigotchi", "KAMI");
    LibConfig.set(components, "KAMI721_ADDRESS", uint256(uint160(address(pet721))));

    console.log("KAMI721_ADDRESS: ", address(pet721));
    return address(pet721);
  }

  /// @dev only for local, to simulate an ERC20. Real onyx is not deployed via this script
  function deployOnyx20(
    IWorld world,
    IUint256Component components,
    address deployer
  ) internal returns (address) {
    require(!LibConfig.has(components, "ONYX_ADDRESS"), "onyx already deployed");

    OpenMintable onyx = new OpenMintable("Onyx", "ONYX");
    LibConfig.set(components, "ONYX_ADDRESS", uint256(uint160(address(onyx))));

    // minting onyx to deployer
    onyx.mint(deployer, 1000 ether);

    console.log("ONYX_ADDRESS: ", address(onyx));
    return address(onyx);
  }
}
