// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IWorld } from "solecs/interfaces/IWorld.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { getAddressById } from "solecs/utils.sol";
import { ERC721MetadataSystem as MetadataSystem, ID as MetadataSystemID } from "systems/ERC721MetadataSystem.sol";
import { ID as MintSystemID } from "systems/ERC721MintSystem.sol";
import { ID as TransferSystemID } from "systems/ERC721TransferSystem.sol";

import { LibPet } from "libraries/LibPet.sol";

import { ERC721 } from "openzeppelin/token/ERC721/ERC721.sol";
import { ERC721Enumerable } from "openzeppelin/token/ERC721/extensions/ERC721Enumerable.sol";

string constant NAME = "Kamigotchi";
string constant SYMBOL = "KAMI";

/* 
  a minimal, non-invasive implementation of MUD compatible ERC721.

  Uses a '2 state' ownership (in game world, out of game world). 
  States are recorded with the StateComponent on each kami.
  '721_EXTERNAL' represents the out of game state, any other state is internal.
  - In game world: 
    - Source of truth is Component values
    - Cannot be modified by non-MUD systems
    - In game transfers update ERC721 contract
  - Out of game world:
    - Source of truth is ERC721 ownership mapping
    - Functions like a regular ERC721
  
  ERC721s are 'bridged' between states with a deposit/withdraw system. Note that 721s do not change wallets.
  Bridge systems do not need to be referenced in this contract

  Metadata is linked to a system for easier MUD compatibility. However, any view function on a contract can be used. 
*/

contract KamiERC721 is ERC721Enumerable {
  IWorld internal immutable World;

  modifier onlySystem(uint256 systemID) {
    IUintComp Systems = World.systems();
    require(getAddressById(Systems, systemID) == msg.sender, "721: not verified system");
    _;
  }

  // requires an ERC721 token to be out of game world
  modifier isOutOfWorld(uint256 tokenID) {
    uint256 entityID = LibPet.indexToID(World.components(), tokenID);
    require(!LibPet.isInWorld(World.components(), entityID), "721: not out of game world");
    _;
  }

  constructor(IWorld _world, string memory _name, string memory _symbol) ERC721(_name, _symbol) {
    World = _world;
  }

  ////////////////////
  // INTERACTIONS
  // these functions are called by systems and are gated

  // allow minting for approved systems (only MintSystem rn)
  function mint(address to, uint256 id) external onlySystem(MintSystemID) {
    _mint(to, id);
  }

  // completes a transfer between two in-game accounts. updates ERC721 to mirror MUD state
  // NOTE: actual system is unimplemented. May be better have a generic permissioning system
  function inWorldTransfer(
    address from,
    address to,
    uint256 id
  ) external onlySystem(TransferSystemID) {
    super.transferFrom(from, to, id);
  }

  ////////////////////
  // ERC721 Overrides

  // disables transfer if token is in game world
  // transfers work as per usual, save for the in-game check
  function _transfer(address from, address to, uint256 id) internal override isOutOfWorld(id) {
    super._transfer(from, to, id);
  }

  // retrives token metadata from ERC721MetadataSystem.
  function tokenURI(uint256 id) public view override returns (string memory) {
    return MetadataSystem(getAddressById(World.systems(), MetadataSystemID)).tokenURI(id);
  }

  ////////////////////
  // ENUMERABLE

  // returns ERC721Enum result in an array
  function getAllTokens(address owner) external view returns (uint256[] memory) {
    uint256[] memory tokens = new uint256[](balanceOf(owner));
    for (uint256 i = 0; i < tokens.length; i++) {
      tokens[i] = tokenOfOwnerByIndex(owner, i);
    }
    return tokens;
  }
}
