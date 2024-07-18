// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibGacha } from "libraries/LibGacha.sol";
import { LibMint20 } from "libraries/LibMint20.sol";

uint256 constant ID = uint256(keccak256("system.Pet.Gacha.Mint"));

/// @notice commits to get a random pet from gacha using a Mint20 token
/// @dev this acts as a replacement for a traditional reveal
contract PetGachaMintSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256 amount = abi.decode(arguments, (uint256));

    uint256 accID = LibAccount.getByOwner(components, msg.sender);
    require(accID != 0, "no account detected");

    // use Mint20 tokens for payment, 1 token for 1 kami. implicit balance check
    LibMint20.burn(world, msg.sender, amount);

    // commits random seed for gacha roll
    uint256[] memory results = LibGacha.commitBatch(world, components, amount, accID, block.number);

    // standard logging and tracking
    LibAccount.logIncPetsMinted(world, components, accID, amount);
    LibAccount.updateLastTs(components, accID);
    return abi.encode(results);
  }

  function executeTyped(uint256 amount) public returns (bytes memory) {
    return execute(abi.encode(amount));
  }

  function init() external onlyOwner {
    LibGacha.initIncrement(components);
  }
}
