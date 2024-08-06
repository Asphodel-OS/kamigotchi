// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IWorld } from "solecs/interfaces/IWorld.sol";
import { IComponent } from "solecs/interfaces/IComponent.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

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
    BlockRevComponent(getAddressById(components, BlockRevealCompID)).set(id, revealBlock);
    IdHolderComponent(getAddressById(components, IdHolderCompID)).set(id, holderID);
    TypeComponent(getAddressById(components, TypeCompID)).set(id, type_);
  }

  /// @notice creates a batch of commits
  /// @dev assumes all commits are fungible
  function commitBatch(
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
    getComponentById(components, BlockRevealCompID).setAll(ids, revealBlock);
    getComponentById(components, IdHolderCompID).setAll(ids, holderID);
    getComponentById(components, TypeCompID).setAll(ids, type_);
  }

  ///////////////
  // CHECKERS

  function isAvailable(uint256 blockNum) internal view returns (bool) {
    return blockNum + 256 >= block.number;
  }

  /// @notice checks if a blockhash is available
  function isAvailable(IUintComp components, uint256 id) internal returns (bool) {
    uint256 revBlock = BlockRevComponent(getAddressById(components, BlockRevealCompID)).get(id);
    return isAvailable(revBlock);
  }

  function isAvailable(IUintComp components, uint256[] memory ids) internal returns (bool) {
    uint256[] memory blocks = BlockRevComponent(getAddressById(components, BlockRevealCompID))
      .getBatch(ids);
    for (uint256 i; i < ids.length; i++) if (!isAvailable(blocks[i])) return false;
    return true;
  }

  ///////////////
  // EXTRACTORS

  /// @notice gets seed from a commit, and remove it
  function extractSeed(IUintComp components, uint256 id) internal returns (uint256) {
    uint256 revBlock = BlockRevComponent(getAddressById(components, BlockRevealCompID)).extract(id);
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
    seeds = BlockRevComponent(getAddressById(components, BlockRevealCompID)).extractBatch(ids);
    for (uint256 i; i < ids.length; i++) seeds[i] = hashSeed(seeds[i], ids[i]);
  }

  function extractHolder(IUintComp components, uint256 id) internal returns (uint256) {
    return IdHolderComponent(getAddressById(components, IdHolderCompID)).extract(id);
  }

  function extractHolders(
    IUintComp components,
    uint256[] memory ids
  ) internal returns (uint256[] memory) {
    return IdHolderComponent(getAddressById(components, IdHolderCompID)).extractBatch(ids);
  }

  function extractType(IUintComp components, uint256 id) internal returns (string memory) {
    return TypeComponent(getAddressById(components, TypeCompID)).extract(id);
  }

  function extractTypes(
    IUintComp components,
    uint256[] memory ids
  ) internal returns (string[] memory) {
    return TypeComponent(getAddressById(components, TypeCompID)).extractBatch(ids);
  }

  /////////////////
  // GETTERS

  // gets seed from future blockhash and entityID. blockhash needs to be revealed within 256 blocks
  function hashSeed(uint256 blocknumber, uint256 entityID) internal view returns (uint256) {
    uint256 bhash = uint256(blockhash(blocknumber));
    require(bhash != 0, "Blockhash unavailable. Contact admin");
    return uint256(keccak256(abi.encodePacked(bhash, entityID)));
  }

  /////////////////
  // SETTERS

  function resetBlock(IUintComp components, uint256 id) internal {
    BlockRevComponent(getAddressById(components, BlockRevealCompID)).set(id, block.number - 1);
  }

  function resetBlocks(IUintComp components, uint256[] memory ids) internal {
    getComponentById(components, BlockRevealCompID).setAll(ids, block.number - 1);
  }

  function unsetHolder(IUintComp components, uint256 id) internal {
    IdHolderComponent(getAddressById(components, IdHolderCompID)).remove(id);
  }

  function unsetHolders(IUintComp components, uint256[] memory ids) internal {
    IdHolderComponent(getAddressById(components, IdHolderCompID)).removeBatch(ids);
  }

  /////////////////
  // UTILS

  /// @notice filters out missing commits, replaces its ID with 0
  /// @dev designed for unintentionally double revealing a commit on FE
  function filterInvalid(IUintComp components, uint256[] memory ids) internal view {
    BlockRevComponent blockComp = BlockRevComponent(getAddressById(components, BlockRevealCompID));
    for (uint256 i; i < ids.length; i++) if (!blockComp.has(ids[i])) ids[i] = 0;
  }
}
