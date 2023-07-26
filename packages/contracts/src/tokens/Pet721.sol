// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IWorld } from "solecs/interfaces/IWorld.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { getAddressById } from "solecs/utils.sol";
import { Pet721MetadataSystem as MetadataSystem, ID as MetadataSystemID } from "systems/Pet721MetadataSystem.sol";
import { ProxyPermissionsERC721Component as PermissionsComp, ID as PermissionsCompID } from "components/ProxyPermissionsERC721Component.sol";

import { LibPet } from "libraries/LibPet.sol";

import { IERC165 } from "openzeppelin/utils/introspection/IERC165.sol";
import { IERC4906 } from "openzeppelin/interfaces/IERC4906.sol";
import { ERC721 } from "openzeppelin/token/ERC721/ERC721.sol";
import { ERC721Enumerable } from "openzeppelin/token/ERC721/extensions/ERC721Enumerable.sol";
import { ERC2981 } from "openzeppelin/token/common/ERC2981.sol";

string constant NAME = "Kamigotchi";
string constant SYMBOL = "KAMI";

/* 
  a minimal, non-invasive implementation of MUD compatible ERC721.

  ERC721s are 'bridged' with a stake/unstake system. 
  Note in game 721s are held by the KamiERC contract, out of game by the EOA.
  
  Uses a '2 state' ownership (in game world, out of game world). 
  States are recorded with the StateComponent on each kami.
  '721_EXTERNAL' represents the out of game state, any other state is internal.
  - In game world: 
    - Held by KamiERC contract [address(this)]
    - Source of truth is Component values
    - Cannot be modified by non-MUD systems
    - In game transfers update ERC721 contract
  - Out of game world:
    - Held by EOA
    - Source of truth is ERC721 ownership mapping
    - Functions like a regular ERC721

  In game transfers are not implemented. However, it will be held by the KamiERC contract and have no owner change.

  Metadata is linked to a system for easier MUD compatibility. However, any view function on a contract can be used. 
*/

contract Pet721 is ERC721Enumerable, ERC2981, IERC4906 {
  IWorld internal immutable World;

  // mirror writable permissions from ProxyPermissionsComponent
  modifier onlyWriter() {
    require(
      PermissionsComp(getAddressById(World.components(), PermissionsCompID)).writeAccess(
        msg.sender
      ),
      "ERC721: not a writer"
    );
    _;
  }

  // mirror owner permissions from ProxyPermissionsComponent
  modifier onlyOwner() {
    require(
      PermissionsComp(getAddressById(World.components(), PermissionsCompID)).owner() == msg.sender,
      "ERC721: not owner"
    );
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

    // set royalties at 3.33% for the quirked up angel number gorls, to owner
    _setDefaultRoyalty(
      PermissionsComp(getAddressById(World.components(), PermissionsCompID)).owner(),
      333 // 333 BPS
    );
  }

  ////////////////////
  // INTERACTIONS
  // these functions are called by systems and are gated

  // allow minting for approved systems
  function mint(address to, uint256 id) external onlyWriter {
    _mint(to, id);
  }

  // bridges NFTs out of game -> in game [stake]
  // only to be called by system
  function stakeToken(address from, uint256 id) external onlyWriter {
    super._transfer(from, address(this), id);
  }

  // bridges NFTs in game -> out of game [unstake]
  // only to be called by system
  function unstakeToken(address to, uint256 id) external onlyWriter {
    super._transfer(address(this), to, id);
  }

  // signals to marketplaces that metadata has been updated
  function emitMetadataUpdate(uint256 id) external onlyWriter {
    emit MetadataUpdate(id);
  }

  // updates default royalty via ERC2981
  function setDefaultRoyalty(address recipient, uint256 feeNumerator) external onlyOwner {
    _setDefaultRoyalty(recipient, uint96(feeNumerator));
  }

  // delete default token royalty
  function deleteDefaultRoyalty() external onlyOwner {
    _deleteDefaultRoyalty();
  }

  // set royalty for a specific token
  function setTokenRoyalty(
    uint256 tokenId,
    address receiver,
    uint256 feeNumerator
  ) external onlyOwner {
    _setTokenRoyalty(tokenId, receiver, uint96(feeNumerator));
  }

  // reset royalty for a specific token
  function resetTokenRoyalty(uint256 tokenId) external onlyOwner {
    _resetTokenRoyalty(tokenId);
  }

  function supportsInterface(
    bytes4 interfaceId
  ) public view virtual override(IERC165, ERC721Enumerable, ERC2981) returns (bool) {
    return super.supportsInterface(interfaceId);
  }

  ////////////////////
  // ERC721 Overrides

  // disables transfer if token is in game world
  // transfers work as per usual, save for the in-game check
  function _transfer(address from, address to, uint256 id) internal override isOutOfWorld(id) {
    super._transfer(from, to, id);
  }

  // retrives token metadata from Pet721RevealSystem.
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
