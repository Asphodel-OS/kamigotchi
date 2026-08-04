// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibDisabled } from "libraries/utils/LibDisabled.sol";
import { LibInventory } from "libraries/LibInventory.sol";
import { LibPool } from "libraries/LibPool.sol";
import { LibPoolRegistry } from "libraries/LibPoolRegistry.sol";

uint256 constant ID = uint256(keccak256("system.pool"));

// PoolSystem holds all player-facing interactions with constant-product Pools:
// swapping and adding/removing liquidity. Liquidity removal deliberately works
// on disabled pools so LPs can always exit
contract PoolSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  /// @notice swap an exact amount of one pool item for the other
  function swap(
    uint32 indexIn,
    uint32 indexOut,
    uint256 amountIn,
    uint256 minAmountOut
  ) public returns (uint256 amountOut) {
    uint256 accID = LibAccount.getByOperator(components, msg.sender);

    uint256 poolID = LibPoolRegistry.get(components, indexIn, indexOut);
    require(poolID != 0, "Pool does not exist");
    LibDisabled.verifyEnabled(components, poolID);
    verifyTradable(indexIn, indexOut);

    amountOut = LibPool.swap(
      components,
      poolID,
      accID,
      indexIn,
      indexOut,
      amountIn,
      minAmountOut
    );
    LibPool.logSwap(world, components, accID, poolID, indexIn, indexOut, amountIn, amountOut);
    LibPool.logSync(world, components, poolID, indexIn, indexOut);

    // standard logging and tracking
    LibAccount.updateLastTs(components, accID);
  }

  /// @notice deposit both pool items at the current reserve ratio for LP shares
  function addLiquidity(
    uint32 indexA,
    uint32 indexB,
    uint256 amountADesired,
    uint256 amountBDesired,
    uint256 amountAMin,
    uint256 amountBMin
  ) public returns (uint256, uint256, uint256) {
    LibPool.AddLiqParams memory p = LibPool.AddLiqParams(
      indexA,
      indexB,
      amountADesired,
      amountBDesired,
      amountAMin,
      amountBMin
    );
    uint256 accID = LibAccount.getByOperator(components, msg.sender);

    uint256 poolID = LibPoolRegistry.get(components, p.indexA, p.indexB);
    require(poolID != 0, "Pool does not exist");
    LibDisabled.verifyEnabled(components, poolID);
    verifyTradable(p.indexA, p.indexB);

    (uint256 amtA, uint256 amtB, uint256 liquidity) = LibPool.addLiquidity(
      components,
      poolID,
      accID,
      p
    );
    LibPool.logLiquidity(world, components, accID, poolID, true, amtA, amtB, liquidity);
    LibPool.logSync(world, components, poolID, p.indexA, p.indexB);

    // standard logging and tracking
    LibAccount.updateLastTs(components, accID);

    return (amtA, amtB, liquidity);
  }

  /// @notice burn LP shares for a pro-rata slice of both reserves
  function removeLiquidity(
    uint32 indexA,
    uint32 indexB,
    uint256 shares,
    uint256 amountAMin,
    uint256 amountBMin
  ) public returns (uint256, uint256) {
    LibPool.RemoveLiqParams memory p = LibPool.RemoveLiqParams(
      indexA,
      indexB,
      shares,
      amountAMin,
      amountBMin
    );
    uint256 accID = LibAccount.getByOperator(components, msg.sender);

    uint256 poolID = LibPoolRegistry.get(components, p.indexA, p.indexB);
    require(poolID != 0, "Pool does not exist");

    (uint256 amtA, uint256 amtB) = LibPool.removeLiquidity(components, poolID, accID, p);
    LibPool.logLiquidity(world, components, accID, poolID, false, amtA, amtB, p.shares);
    LibPool.logSync(world, components, poolID, p.indexA, p.indexB);

    // standard logging and tracking
    LibAccount.updateLastTs(components, accID);

    return (amtA, amtB);
  }

  function verifyTradable(uint32 indexA, uint32 indexB) internal view {
    uint32[] memory indices = new uint32[](2);
    indices[0] = indexA;
    indices[1] = indexB;
    LibInventory.verifyTransferable(components, indices);
  }

  function execute(bytes memory arguments) public returns (bytes memory) {
    require(false, "not implemented");
  }
}
