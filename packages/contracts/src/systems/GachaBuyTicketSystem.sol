// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibConfig } from "libraries/LibConfig.sol";
import { LibData } from "libraries/LibData.sol";
import { LibFlag } from "libraries/LibFlag.sol";
import { LibInventory, GACHA_TICKET_INDEX } from "libraries/LibInventory.sol";

uint256 constant ID = uint256(keccak256("system.buy.gacha.ticket"));

uint32 constant CURRENCY = 103; // ETH token index

contract GachaBuyTicketSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function buyPublic(uint256 amount) public {
    uint256 accID = LibAccount.getByOwner(components, msg.sender);

    verifyGlobalTotal(amount);
    verifyAccPublic(accID, amount);

    uint256 cost = LibConfig.get(components, "MINT_PRICE_PUBLIC") * amount;
    LibInventory.decFor(components, accID, CURRENCY, cost);
    LibInventory.incFor(components, accID, GACHA_TICKET_INDEX, amount);

    logMint(accID, amount);
    LibAccount.updateLastTs(components, accID);
  }

  function buyWL() public {
    uint256 accID = LibAccount.getByOwner(components, msg.sender);

    verifyGlobalTotal(1);
    verifyAccWL(accID);

    uint256 cost = LibConfig.get(components, "MINT_PRICE_WL");
    LibInventory.decFor(components, accID, CURRENCY, cost);
    LibInventory.incFor(components, accID, GACHA_TICKET_INDEX, 1);

    logMint(accID, 1);
    LibAccount.updateLastTs(components, accID);
  }

  function execute(bytes memory arguments) public returns (bytes memory) {
    require(false, "not implemented");
    return "";
  }

  //////////////////
  // INTERNAL

  function logMint(uint256 accID, uint256 amount) internal {
    LibData.inc(components, 0, 0, "MINT_NUM_GLOBAL", amount);
    LibData.inc(components, accID, 0, "MINT_NUM", amount);
  }

  function verifyGlobalTotal(uint256 amount) internal view {
    uint256 max = LibConfig.get(components, "MINT_NUM_MAX");
    if (LibData.get(components, 0, 0, "MINT_NUM_GLOBAL") + amount > max)
      revert("max mints reached");
  }

  function verifyAccPublic(uint256 accID, uint256 amount) internal {
    // checking if public mint open
    if (!LibConfig.has(components, "MINT_PUBLIC_OPEN")) revert("public mint closed");
    // checking max per account
    uint256 max = LibConfig.get(components, "MINT_NUM_MAX_PER_ACC");
    if (LibData.get(components, accID, 0, "MINT_NUM_PUBLIC") + amount > max)
      revert("max mints per account reached");
    LibData.inc(components, accID, 0, "MINT_NUM_PUBLIC", amount);
  }

  function verifyAccWL(uint256 accID) internal {
    if (!LibFlag.has(components, accID, "MINT_WHITELISTED")) revert("not whitelisted");
    LibFlag.remove(components, accID, "MINT_WHITELISTED");
  }
}
