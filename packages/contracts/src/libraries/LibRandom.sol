// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IComponent } from "solecs/interfaces/IComponent.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { BlockRevealComponent as BlockRevealComp, ID as BlockRevealCompID } from "components/BlockRevealComponent.sol";

library LibRandom {
  //////////////////
  // SEED GEN

  // gets seed from future blockhash. blockhash needs to be revealed within 256 blocks
  function getSeedBlockhash(uint256 blocknumber) internal view returns (uint256 result) {
    // require(block.number - blocknumber <= 256, "LibRandom: blockhash too old");
    result = uint256(blockhash(blocknumber));
    require(result != 0, "LibRandom: blockhash unavailable. Contact admin");
  }

  //////////////////
  // SETTERS

  function setRevealBlock(IUintComp components, uint256 id, uint256 revealBlock) internal {
    BlockRevealComp(getAddressById(components, BlockRevealCompID)).set(id, revealBlock);
  }

  function removeRevealBlock(IUintComp components, uint256 id) internal {
    BlockRevealComp(getAddressById(components, BlockRevealCompID)).remove(id);
  }

  /////////////////
  // GETTERS

  function getRevealBlock(IUintComp components, uint256 id) internal view returns (uint256) {
    return BlockRevealComp(getAddressById(components, BlockRevealCompID)).getValue(id);
  }

  function hasRevealBlock(IUintComp components, uint256 id) internal view returns (bool) {
    return BlockRevealComp(getAddressById(components, BlockRevealCompID)).has(id);
  }

  //////////////////
  // WEIGHTED

  // select an item from a weighted list of options

  // @notice picks from a weighted random array based on a random input
  // @param keys     keys, position correspnds to weights
  // @param weights  the weights for each item
  // @param randN    the input random number
  // @return         the selected key
  function selectFromWeighted(
    uint256[] memory keys,
    uint256[] memory weights,
    uint256 randN
  ) internal pure returns (uint256) {
    uint256 totalWeight;
    for (uint256 i; i < weights.length; i++) {
      totalWeight += weights[i];
    }

    return keys[_positionFromWeighted(weights, totalWeight, randN)];

    // should never get here
    revert("LibRandom: no item found");
  }

  // @notice picks multiple results from weighted array
  // @dev returns an array of results, with indices as number of results corresponding to key positions
  // @dev uses a basic uint256(keccak256(abi.encode(seed, i))) for incrementing seeds
  // @param weights  the weights for each item
  // @param randN    the input random number
  // @param count    the number of rolls
  // @return         array with indices as number of results corresponding to key positions
  function selectMultipleFromWeighted(
    uint256[] memory weights,
    uint256 randN,
    uint256 count
  ) internal pure returns (uint256[] memory) {
    uint256 totalWeight;
    for (uint256 i; i < weights.length; i++) {
      totalWeight += weights[i];
    }

    uint256[] memory results = new uint256[](weights.length);

    for (uint256 i; i < count; i++) {
      uint256 pos = _positionFromWeighted(
        weights,
        totalWeight,
        uint256(keccak256(abi.encode(randN, i)))
      );
      results[pos]++;
    }

    return results;
  }

  // @notice picks from a weighted random array, returns position and value of result
  // @dev low level function. not meant to be implemented outside of this lib
  // @param weights      the weights for each item
  // @param totalWeight  the total weight of all items
  // @param randN        the input random number
  // @return             the position of the result
  function _positionFromWeighted(
    uint256[] memory weights,
    uint256 totalWeight,
    uint256 randN
  ) internal pure returns (uint256) {
    // roll for the constrained random number
    uint256 roll = randN % totalWeight;

    // iterate to find item
    uint256 currentWeight;
    for (uint256 i; i < weights.length; i++) {
      currentWeight += weights[i];
      if (roll <= currentWeight) {
        return (i);
      }
    }

    // should never get here
    revert("LibRandom: no item found");
  }

  //////////////////
  // PACKED UNWEIGHTED
  // bitpacked arrays with random values, no weights
  // functions are prefixed with p

  // generates a non-weighted random bitpacked array from a seed
  // it uses a MaxElements packed array to determine the max value for each element
  // MaxElements can be generated
  function pGenerateFromSeed(
    uint256 seed,
    uint256 pMax,
    uint256 numElements,
    uint256 SIZE
  ) internal pure returns (uint256) {
    // only take set number of elements
    seed = seed & ((1 << (SIZE * numElements)) - 1);

    // iterate to generate result
    uint256 result;
    for (uint256 i; i < numElements; i++) {
      // non-defult items always have a max 0
      uint256 cMax = (pMax >> (SIZE * i)) & ((1 << SIZE) - 1);
      uint256 cSeed = (seed >> (SIZE * i)) & ((1 << SIZE) - 1);

      // skip if 0
      if (cMax == 0) {
        result = result << SIZE;
        continue;
      }

      result = (result << SIZE) | ((cSeed % cMax) + 1);
    }

    return result;
  }

  //////////////////
  // BITPACK HELPERS

  // @dev: updates a bitpacked value at a specific position. returns the new packed array
  // @param newElement: the new value to set
  // @param position: the position to set
  // @param maxPos: the number of elements in array
  // @param SIZE: the size of each element (eg 8 for uint8, which allows for 32 values packed)
  // @param packed: the original packed value
  function pUpdateElement(
    uint256 newElement,
    uint256 position,
    uint256 maxPos,
    uint256 SIZE,
    uint256 packed
  ) internal pure returns (uint256) {
    require(position < (256 / SIZE) && position <= maxPos, "out of bounds");
    require(newElement < (1 << SIZE), "new num out of bounds");

    return
      (packed & ~(((1 << SIZE) - 1) << (SIZE * (maxPos - position)))) |
      (newElement << (SIZE * (maxPos - position)));
  }

  // converts a regular array to a bitpacked array
  function packArray(uint256[] memory arr, uint256 SIZE) internal pure returns (uint256) {
    uint256 result;
    for (uint256 i; i < arr.length; i++) {
      require(arr[i] < (1 << SIZE) - 1, "max over limit");
      result = (result << SIZE) | arr[i];
    }

    return result;
  }

  // converts a bitpacked array to a regular array
  function unpackArray(
    uint256 packed,
    uint256 numElements,
    uint256 SIZE
  ) internal pure returns (uint256[] memory) {
    uint256[] memory result = new uint256[](numElements);

    for (uint256 i; i < numElements; i++) {
      // packed order is reversed
      // result[numElements-1-i] = packed & ((1 << SIZE) - 1);
      result[i] = packed & ((1 << SIZE) - 1);

      packed = packed >> SIZE;
    }

    return result;
  }
}
