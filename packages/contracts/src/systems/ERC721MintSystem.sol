// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { IWorld } from "solecs/interfaces/IWorld.sol";
import { System } from "solecs/System.sol";
import { getAddressById } from "solecs/utils.sol";

import { BalanceComponent, ID as BalanceCompID } from "components/BalanceComponent.sol";
import { MediaURIComponent, ID as MediaURICompID } from "components/MediaURIComponent.sol";
import { LibAccount } from "libraries/LibAccount.sol";
import { LibERC721 } from "libraries/LibERC721.sol";
import { LibPet } from "libraries/LibPet.sol";
import { LibRandom } from "libraries/LibRandom.sol";

uint256 constant ID = uint256(keccak256("system.ERC721.Mint"));

// unrevealed URI is set as the placeholder

contract ERC721MintSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    address to = abi.decode(arguments, (address));
    uint256 nextMint = nextMintID();

    // Get the account for this owner(to). fails if doesnt exist
    uint256 accountID = LibAccount.getByOwner(components, to);
    require(accountID != 0, "ERC721MintSystem: no account");

    // Create the pet, commit random
    uint256 petID = LibPet.create(world, components, accountID, nextMint);
    LibRandom.setRevealBlock(components, petID, block.number);

    // Mint the token
    LibERC721.mintInGame(world, nextMint);

    return abi.encode(petID);
  }

  function executeTyped(address to) public returns (bytes memory) {
    return execute(abi.encode(to));
  }

  // uses BalanceComponent to track minted tokens. Uses systemID as entityID
  function nextMintID() internal returns (uint256 curr) {
    BalanceComponent bComp = BalanceComponent(getAddressById(components, BalanceCompID));

    if (!bComp.has(ID) || bComp.getValue(ID) == 0) {
      bComp.set(ID, 1);
      curr = 1;
    } else {
      curr = bComp.getValue(ID) + 1;
      bComp.set(ID, curr);
    }
  }
}
