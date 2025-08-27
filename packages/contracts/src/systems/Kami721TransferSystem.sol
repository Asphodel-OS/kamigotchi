// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { Kami721 } from "tokens/Kami721.sol";
import { LibKami721 } from "libraries/LibKami721.sol";

uint256 constant ID = uint256(keccak256("system.kami721.transfer"));

/** @dev
 * Simple system to enable kami batch transfers.
 * Handles 721 contract only, does not interact with components.
 */
contract Kami721TransferSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function batchTransferToSingle(uint256[] memory tokenIndices, address to) public {
    Kami721 nft = LibKami721.getContract(components);
    for (uint256 i; i < tokenIndices.length; i++) {
      transfer(nft, tokenIndices[i], to);
    }
  }

  function batchTransferToMultiple(uint256[] memory tokenIndices, address[] memory to) public {
    require(tokenIndices.length == to.length, "tokenIndices and to must be the same length");
    Kami721 nft = LibKami721.getContract(components);
    for (uint256 i; i < tokenIndices.length; i++) {
      transfer(nft, tokenIndices[i], to[i]);
    }
  }

  function execute(bytes memory arguments) public returns (bytes memory) {
    require(false, "Kami721Transfer: not implemented");
    return "";
  }

  /// @dev only works for external kamis. requires approval prior
  function transfer(Kami721 nft, uint256 index, address to) internal {
    require(nft.ownerOf(index) == msg.sender, "not ur kami");
    nft.transferFrom(msg.sender, to, index);
  }
}
