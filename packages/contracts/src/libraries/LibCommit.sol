// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { IWorld } from "solecs/interfaces/IWorld.sol";
import { IComponent } from "solecs/interfaces/IComponent.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";

import { BlockRevealComponent as BlockRevComponent, ID as BlockRevealCompID } from "components/BlockRevealComponent.sol";
import { IdHolderComponent, ID as IdHolderCompID } from "components/IdHolderComponent.sol";
import { TypeComponent, ID as TypeCompID } from "components/TypeComponent.sol";

import { LibComp } from "libraries/utils/LibComp.sol";
import { LibRandom } from "libraries/utils/LibRandom.sol";

/** @notice library for commit/reveal patters
 * Commits are designed to be extended upon depending on its use, but have a minimum shape
 * - RevealBlock
 * - Type
 * - HolderID
 */
library LibCommit {
  using LibComp for IComponent;

  /////////////////
  // SHAPES

  /// @notice create a basic commit
  function commit(
    IWorld world,
    IUintComp components,
    uint256 holderID,
    uint256 revealBlock,
    string memory type_
  ) internal returns (uint256 id) {
    id = world.getUniqueEntityId();
    BlockRevComponent(getAddrByID(components, BlockRevealCompID)).set(id, revealBlock);
    IdHolderComponent(getAddrByID(components, IdHolderCompID)).set(id, holderID);
    TypeComponent(getAddrByID(components, TypeCompID)).set(id, type_);
  }

  /// @notice creates a batch of commits
  /// @dev assumes all commits are fungible
  function commit(
    IWorld world,
    IUintComp components,
    uint256 holderID,
    uint256 revealBlock,
    string memory type_,
    uint256 amount
  ) internal returns (uint256[] memory ids) {
    ids = new uint256[](amount);

    uint256 id = world.getUniqueEntityId();
    for (uint256 i; i < amount; i++) {
      id = uint256(keccak256(abi.encode(id, i)));
      ids[i] = id;
    }

    // writing
    getCompByID(components, BlockRevealCompID).setAll(ids, revealBlock);
    getCompByID(components, IdHolderCompID).setAll(ids, holderID);
    getCompByID(components, TypeCompID).setAll(ids, type_);
  }

  ///////////////
  // CHECKERS

  function isAvailable(uint256 blockNum) internal view returns (bool) {
    return uint256(blockhash(blockNum)) != 0;
  }

  /// @notice checks if a blockhash is available
  function isAvailable(IUintComp components, uint256 id) internal returns (bool) {
    uint256 revBlock = BlockRevComponent(getAddrByID(components, BlockRevealCompID)).get(id);
    return isAvailable(revBlock);
  }

  function isAvailable(IUintComp components, uint256[] memory ids) internal returns (bool) {
    uint256[] memory blocks = BlockRevComponent(getAddrByID(components, BlockRevealCompID)).get(
      ids
    );
    for (uint256 i; i < ids.length; i++) if (!isAvailable(blocks[i])) return false;
  }

  ///////////////
  // EXTRACTORS

  /// @notice gets seed from a commit, and remove it
  function extractSeed(IUintComp components, uint256 id) internal returns (uint256) {
    uint256 revBlock = BlockRevComponent(getAddrByID(components, BlockRevealCompID)).extract(id);
    return hashSeed(revBlock, id);
  }

  /// @notice bypasses component registry to extract seed
  function extractSeedDirect(BlockRevComponent blockComp, uint256 id) internal returns (uint256) {
    return hashSeed(blockComp.extract(id), id);
  }

  function extractSeeds(
    IUintComp components,
    uint256[] memory ids
  ) internal returns (uint256[] memory seeds) {
    seeds = BlockRevComponent(getAddrByID(components, BlockRevealCompID)).extract(ids);
    for (uint256 i; i < ids.length; i++) seeds[i] = hashSeed(seeds[i], ids[i]);
  }

  function extractHolder(IUintComp components, uint256 id) internal returns (uint256) {
    return IdHolderComponent(getAddrByID(components, IdHolderCompID)).extract(id);
  }

  function extractHolders(
    IUintComp components,
    uint256[] memory ids
  ) internal returns (uint256[] memory) {
    return IdHolderComponent(getAddrByID(components, IdHolderCompID)).extract(ids);
  }

  function extractType(IUintComp components, uint256 id) internal returns (string memory) {
    return TypeComponent(getAddrByID(components, TypeCompID)).extract(id);
  }

  function extractTypes(
    IUintComp components,
    uint256[] memory ids
  ) internal returns (string[] memory) {
    return TypeComponent(getAddrByID(components, TypeCompID)).extract(ids);
  }

  /////////////////
  // GETTERS

  // gets seed from future blockhash and entityID. blockhash needs to be revealed within 256 blocks
  function hashSeed(uint256 blocknumber, uint256 entityID) internal view returns (uint256) {
    uint256 bhash = uint256(blockhash(blocknumber));
    if (bhash == 0) revert("Blockhash unavailable. Contact admin");
    return uint256(keccak256(abi.encodePacked(bhash, entityID)));
  }

  /////////////////
  // SETTERS

  function resetBlock(IUintComp components, uint256 id) internal {
    BlockRevComponent(getAddrByID(components, BlockRevealCompID)).set(id, block.number - 1);
  }

  function resetBlocks(IUintComp components, uint256[] memory ids) internal {
    getCompByID(components, BlockRevealCompID).setAll(ids, block.number - 1);
  }

  function unsetHolder(IUintComp components, uint256 id) internal {
    IdHolderComponent(getAddrByID(components, IdHolderCompID)).remove(id);
  }

  function unsetHolders(IUintComp components, uint256[] memory ids) internal {
    IdHolderComponent(getAddrByID(components, IdHolderCompID)).remove(ids);
  }

  /////////////////
  // UTILS

  /// @notice filters out missing commits, replaces its ID with 0
  /// @dev designed for unintentionally double revealing a commit on FE
  function filterInvalid(IUintComp components, uint256[] memory ids) internal view {
    BlockRevComponent blockComp = BlockRevComponent(getAddrByID(components, BlockRevealCompID));
    for (uint256 i; i < ids.length; i++) if (!blockComp.has(ids[i])) ids[i] = 0;
  }
}
