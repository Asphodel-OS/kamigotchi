// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Imports.sol";
import { console } from "forge-std/console.sol";

/// @notice deploys erc20 and erc721 token contracts
/// @dev assumes ValueComp is registered. This is only expected to be called during initial world setup
library LibDeployTokens {
  function deployPet721(IWorld world, IUint256Component components) internal returns (address) {
    require(!LibConfig.has(components, "PET721_ADDRESS"), "pet721 already deployed");

    Pet721 pet721 = new Pet721(world, "Kamigotchi", "KAMI");
    LibConfig.set(components, "PET721_ADDRESS", uint256(uint160(address(pet721))));

    console.log("PET721_ADDRESS: ", address(pet721));
    return address(pet721);
  }

  // deprecated: world2 remove
  function deployMint20(IWorld world, IUint256Component components) internal returns (address) {
    require(!LibConfig.has(components, "MINT20_ADDRESS"), "mint20 already deployed");

    Mint20 mint20 = new Mint20(world, "Mint20", "MINT20");
    LibConfig.set(components, "MINT20_ADDRESS", uint256(uint160(address(mint20))));

    console.log("MINT20_ADDRESS: ", address(mint20));
    return address(mint20);
  }
}
