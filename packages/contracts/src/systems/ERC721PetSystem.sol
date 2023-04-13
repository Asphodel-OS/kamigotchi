// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { IWorld } from "solecs/interfaces/IWorld.sol";
import { System } from "solecs/System.sol";
import { getAddressById } from "solecs/utils.sol";
import { ERC721 } from "solmate/tokens/ERC721.sol";

import { BalanceComponent, ID as BalanceCompID } from "components/BalanceComponent.sol";
import { LibAccount } from "libraries/LibAccount.sol";
import { LibPet } from "libraries/LibPet.sol";
import { PetMetadataSystem, ID as PetMetadataSystemID } from "systems/PetMetadataSystem.sol";

uint256 constant ID = uint256(keccak256("system.ERC721.pet"));
string constant NFT_NAME = "Kamigotchi";
string constant NFT_SYMBOL = "KAMI";
// unrevealed URI is set as the placeholder. actual random implementation unimplemented for demo, no proper vrf on localhost
string constant UNREVEALED_URI = "https://kamigotchi.nyc3.cdn.digitaloceanspaces.com/placeholder.gif";

contract ERC721PetSystem is System, ERC721 {
  /*******************************
   *         Mint Details
   ********************************/
  // uint256 public totalSupply;

  constructor(
    IWorld _world,
    address _components
  ) System(_world, _components) ERC721(NFT_NAME, NFT_SYMBOL) {}

  /*********************
   *  Public Functions
   **********************/

  function mint(address to) public returns (uint256) {
    // require(tx.origin == msg.sender, "no contracts");
    // leaving totalSupply in for now, but not used
    // ++totalSupply; // arrays start at 1 here :3
    uint256 nextMint = nextMintID();

    // Get the account for this owner(to). Create one if it doesn't exist.
    uint256 accountID = LibAccount.getByOwner(components, to);
    if (accountID == 0) {
      accountID = LibAccount.create(world, components, to, to);
    }

    // TODO: set stats based on the generated traits of the pet.
    uint256 petID = LibPet.create(world, components, to, accountID, nextMint, UNREVEALED_URI);
    _mint(to, nextMint);
    return petID;
  }

  function tokenURI(uint256 tokenID) public view override returns (string memory) {
    return
      PetMetadataSystem(getAddressById(world.systems(), PetMetadataSystemID)).tokenURI(tokenID);
  }

  /*********************
   *     MUD Hoppers
   **********************/
  // not used in mud but nice to have
  function tokenIDToEntityID(uint256 petIndex) public view returns (uint256) {
    return LibPet.indexToID(components, petIndex);
  }

  // uses BalanceComponent to track minted tokens. Uses systemID as entityID
  function nextMintID() internal returns (uint256) {
    BalanceComponent bComp = BalanceComponent(getAddressById(components, BalanceCompID));

    // no need to init balance value, assume init in world

    uint256 cur = bComp.getValue(ID) + 1;
    bComp.set(ID, cur);
    return cur;
  }

  // NOTE: the id here is actually the ERC721 id, aka the pet index in our world
  function transferFrom(address from, address to, uint256 id) public virtual override {
    // Get the account for the new owner(to). Create one if it doesn't exist.
    uint256 accountID = LibAccount.getByOwner(components, to);
    if (accountID == 0) {
      accountID = LibAccount.create(world, components, to, to);
    }

    // ownership checks and updates should keep us safe from the ERC721 side
    LibPet.transfer(components, id, accountID);
    super.transferFrom(from, to, id);
  }

  // required for MUD, not in use
  function execute(bytes memory arguments) public pure returns (bytes memory) {
    require(false, "execute not available");
    arguments = "";
    return "";
  }

  function executeTyped(address ownerAddy) public pure returns (bytes memory) {
    return execute(abi.encode(ownerAddy));
  }
}
