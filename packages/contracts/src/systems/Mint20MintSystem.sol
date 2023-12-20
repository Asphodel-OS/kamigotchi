// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibConfig } from "libraries/LibConfig.sol";
import { LibMint20 } from "libraries/LibMint20.sol";

import { Farm20 } from "tokens/Farm20.sol";
import { Farm20ProxySystem, ID as ProxyID } from "systems/Farm20ProxySystem.sol";

uint256 constant ID = uint256(keccak256("system.Mint20.Mint"));

/// @notice depreciated
/// @dev depreciated but still left in for testnet. Not needed for audit
contract Mint20MintSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function mint(uint256 amount) external payable {
    // balance checks
    require(amount > 0, "Mint20Mint: must be > 0");
    uint256 price = LibConfig.getValueOf(components, "MINT_PRICE");
    require(msg.value >= price * amount, "Mint20Mint: not enough ETH");

    // check that resulting tx does not exceed the total supply limit
    uint256 totalMinted = LibMint20.getTotalMinted(world);
    require(
      totalMinted + amount <= LibConfig.getValueOf(components, "MINT_INITIAL_MAX"),
      "Mint20Mint: supply limit exceeded"
    );

    // get the account for the caller (owner)
    // check that it exists and is in the correct room
    uint256 accountID = LibAccount.getByOwner(components, msg.sender);
    require(accountID != 0, "Mint20Mint: addy has no acc");

    // check that resulting account does not exceed the account limit
    uint256 accountMinted = LibAccount.getMint20Minted(components, accountID);
    require(
      accountMinted + amount <= LibConfig.getValueOf(components, "MINT_ACCOUNT_MAX"),
      "Mint20Mint: account limit exceeded"
    );

    // update num minted and mint the tokens
    LibAccount.setMint20Minted(world, components, accountID, accountMinted + amount);
    LibMint20.mint(world, msg.sender, amount);

    // standard logging and tracking
    LibAccount.updateLastTs(components, accountID);
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
