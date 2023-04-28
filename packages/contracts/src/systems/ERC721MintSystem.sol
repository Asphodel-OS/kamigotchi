// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { IWorld } from "solecs/interfaces/IWorld.sol";
import { System } from "solecs/System.sol";
import { getAddressById } from "solecs/utils.sol";

import { BalanceComponent, ID as BalanceCompID } from "components/BalanceComponent.sol";
import { MediaURIComponent, ID as MediaURICompID } from "components/MediaURIComponent.sol";
import { LibAccount } from "libraries/LibAccount.sol";
import { LibPet } from "libraries/LibPet.sol";
import { LibRandom } from "libraries/LibRandom.sol";

import { KamiERC721 } from "tokens/KamiERC721.sol";
import { ERC721ProxySystem, ID as ProxyID } from "systems/ERC721ProxySystem.sol";

uint256 constant ID = uint256(keccak256("system.ERC721.Mint"));

// unrevealed URI is set as the placeholder. actual random implementation unimplemented for demo, no proper vrf on localhost
string constant UNREVEALED_URI = "https://kamigotchi.nyc3.cdn.digitaloceanspaces.com/placeholder.gif";

contract ERC721MintSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    address to = abi.decode(arguments, (address));
    uint256 nextMint = nextMintID();

    // Get the account for this owner(to). Create one if it doesn't exist.
    uint256 accountID = LibAccount.getByOwner(components, to);
    if (accountID == 0) {
      accountID = LibAccount.create(world, components, to, to);
    }

    // TODO: set stats based on the generated traits of the pet.
    uint256 petID = LibPet.create(world, components, to, accountID, nextMint, UNREVEALED_URI);

    KamiERC721 token = ERC721ProxySystem(getAddressById(world.systems(), ProxyID)).getToken();
    token.mint(to, nextMint);
    LibRandom.seedEntropy(world);
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

  // uses MediaURIComponent to track unrevealed URI
  function unrevealedURI() internal returns (string memory) {
    MediaURIComponent mComp = MediaURIComponent(getAddressById(components, MediaURICompID));

    if (mComp.has(ID)) {
      return mComp.getValue(ID);
    } else {
      mComp.set(ID, UNREVEALED_URI);
      return UNREVEALED_URI;
    }
  }
}
