// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IWorld } from "solecs/interfaces/IWorld.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { getAddressById } from "solecs/utils.sol";
import { ERC721MetadataSystem as MetadataSystem, ID as MetadataSystemID } from "systems/ERC721MetadataSystem.sol";
import { ID as MintSystemID } from "systems/ERC721MintSystem.sol";
import { ID as TransferSystemID } from "systems/ERC721TransferSystem.sol";

import { LibPet } from "libraries/LibPet.sol";

import { ERC721 } from "solmate/tokens/ERC721.sol";

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

contract KamiERC721 is ERC721 {
  IWorld immutable World;

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
  function transferFrom(address from, address to, uint256 id) public override isOutOfWorld(id) {
    super.transferFrom(from, to, id);
  }

  // retrives token metadata from ERC721MetadataSystem.
  function tokenURI(uint256 id) public view override returns (string memory) {
    return MetadataSystem(getAddressById(World.systems(), MetadataSystemID)).tokenURI(id);
  }
}

// archived notes:
// a non upgradable implementation of ERC721 with an in/out of game world ownership structure
// in game and outside ownership have two distinct shapes
/* ownership structure:
  in game [Source of truth: MUD Account Entity] (NOTE: unimplemented! these are future goals): 
    1) Kami is owned by Account. ownerOf() points to owner of Account
    2) transferring between accounts in game is supported by emitting the event in this contract
    3) ERC721 ownership mapping still exists, but is not the source of truth when kamis are in game
  out of game [Source of truth: ERC721 ownership mapping]:
    1) Kami is owned by EOA. ownerOf() points to EOA
    2) Functions like a regular ERC721
  the bridge between these states are withdraw/deposit systems
  states are handled by the StateComponent on each kami 
   - '721_EXTERNAL' represents the out of game state, any other state is internal.
   only revealed contracts can be bridged out of game
*/
/* BRIDGING:
  no need to support bridging systems in this contract;
  state is ref externally via StateComponent
*/
// NOTE: in game ownership structures are currently implemented. not needed unless
//      we're supporting in-game transfers, which is a stretch goal as of now
