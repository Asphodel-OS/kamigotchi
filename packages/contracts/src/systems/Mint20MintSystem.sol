// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibConfig } from "libraries/LibConfig.sol";
import { LibTokens } from "libraries/LibTokens.sol";

import { Farm20 } from "tokens/Farm20.sol";
import { Farm20ProxySystem, ID as ProxyID } from "systems/Farm20ProxySystem.sol";

uint256 constant ID = uint256(keccak256("system.Mint20.Mint"));

// initial 1111 supply, minted before GDA for a fixed price
// mints here are capped when supply reaches 1111, including whitelist.
// assumes GDA only starts when this is minted out, otherwise GDA mints will count to 1111 (which is ok)
contract Mint20MintSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function mint(uint256 amount) external payable {
    // checks
    require(amount > 0, "Mint20Mint: amt must be > 0");

    uint256 price = LibConfig.getValueOf(components, "MINT_PRICE");
    require(msg.value >= price * amount, "Mint20Mint: not enough ETH");

    uint256 accountID = LibAccount.getByOwner(components, msg.sender);
    require(accountID != 0, "Mint20Mint: addy has no acc");

    uint256 accMinted = LibAccount.getMint20Minted(components, accountID);
    require(
      accMinted + amount <= LibConfig.getValueOf(components, "MINT_ACCOUNT_MAX"),
      "Mint20Mint: max account minted"
    );

    uint256 totalMinted = LibTokens.getTotalMint20Minted(world);
    require(
      totalMinted + amount <= LibConfig.getValueOf(components, "MINT_INITIAL_MAX"),
      "Mint20Mint: max inital minted"
    );

    // update num minted
    LibAccount.setMint20Minted(world, components, accountID, accMinted + amount);

    // mint token
    LibTokens.mintMint20(world, msg.sender, amount);
  }

  function execute(bytes memory arguments) public returns (bytes memory) {
    require(false, "Mint20Mint: not implemented");
    return "";
  }

  // function executeTyped(uint256 amount) public returns (bytes memory) {
  //   return execute(abi.encode(amount));
  // }

  function withdraw() external onlyOwner {
    payable(owner()).transfer(address(this).balance);
  }
}
