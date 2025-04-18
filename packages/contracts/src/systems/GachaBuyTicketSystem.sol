// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { LibTypes } from "solecs/LibTypes.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibConfig } from "libraries/LibConfig.sol";
import { LibData } from "libraries/LibData.sol";
import { LibEmitter } from "libraries/utils/LibEmitter.sol";
import { LibFlag } from "libraries/LibFlag.sol";
import { LibInventory, GACHA_TICKET_INDEX } from "libraries/LibInventory.sol";

uint256 constant ID = uint256(keccak256("system.buy.gacha.ticket"));

uint32 constant CURRENCY = 103; // ETH token index

/**
 * --CONFIGS--
 * MINT_MAX_TOTAL // aggregate max total mints
 * MINT_MAX_WL // account max whitelist mints
 * MINT_START_WL // start epoch ts of whitelist mint
 * MINT_PRICE_WL // price of whitelist mint
 * MINT_MAX_PUBLIC // account max public mints
 * MINT_START_PUBLIC // start epoch ts of public mint
 * MINT_PRICE_PUBLIC // price of public mint

 * --DATA--
 * MINT_NUM_WL // num wl minted (id 0 for aggregate)
 * MINT_NUM_PUBLIC // num public minted (id 0 for aggregate)
 * MINT_NUM_TOTAL // num total minted (id 0 for aggregate)

 * --FLAGS--
 * MINT_WHITELISTED // whether the account is whitelisted
 */

contract GachaBuyTicketSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  // purchase a gacha ticket from the public mint
  function buyPublic(uint256 amount) public {
    uint256 accID = LibAccount.getByOwner(components, msg.sender);

    // validation
    verifyGlobal(amount);
    verifyAccPublic(accID, amount);

    // execution
    uint256 cost = LibConfig.get(components, "MINT_PRICE_PUBLIC") * amount;
    LibInventory.decFor(components, accID, CURRENCY, cost);
    LibInventory.incFor(components, accID, GACHA_TICKET_INDEX, amount);

    // logging
    logMint(accID, amount, cost);
    LibData.inc(components, 0, 0, "MINT_NUM_PUBLIC", amount);
    LibData.inc(components, accID, 0, "MINT_NUM_PUBLIC", amount);
    LibAccount.updateLastTs(components, accID);
  }

  // purchase a gacha ticket from the whitelist mint
  function buyWL() public {
    uint256 accID = LibAccount.getByOwner(components, msg.sender);

    // validation
    verifyGlobal(1);
    verifyAccWL(accID);

    // execution
    uint256 cost = LibConfig.get(components, "MINT_PRICE_WL");
    LibInventory.decFor(components, accID, CURRENCY, cost);
    LibInventory.incFor(components, accID, GACHA_TICKET_INDEX, 1);

    // logging
    logMint(accID, 1, cost);
    LibData.inc(components, 0, 0, "MINT_NUM_WL", 1);
    LibData.inc(components, accID, 0, "MINT_NUM_WL", 1);
    LibAccount.updateLastTs(components, accID);
  }

  function execute(bytes memory arguments) public returns (bytes memory) {
    require(false, "not implemented");
    return "";
  }

  //////////////////
  // INTERNAL

  // log the mint quantities on data entities and emitted events
  function logMint(uint256 accID, uint256 amount, uint256 cost) internal {
    LibData.inc(components, 0, 0, "MINT_NUM_TOTAL", amount);
    LibData.inc(components, accID, 0, "MINT_NUM_TOTAL", amount);

    uint8[] memory _schema = new uint8[](3);
    _schema[0] = uint8(LibTypes.SchemaValue.UINT256); // accID
    _schema[1] = uint8(LibTypes.SchemaValue.UINT256); // amount
    _schema[2] = uint8(LibTypes.SchemaValue.UINT256); // cost

    LibEmitter.emitEvent(world, "MINT", _schema, abi.encode(accID, amount, cost));
  }

  // run validation checks on the global mint
  function verifyGlobal(uint256 amount) internal view {
    // check if max total is being exceeded
    uint256 max = LibConfig.get(components, "MINT_MAX_TOTAL");
    if (LibData.get(components, 0, 0, "MINT_NUM_TOTAL") + amount > max) {
      revert("max mints reached");
    }
  }

  // run validation checks on the public mint
  function verifyAccPublic(uint256 accID, uint256 amount) internal {
    // check if public mint has started
    if (block.timestamp < LibConfig.get(components, "MINT_START_PUBLIC")) {
      revert("public mint has not yet started");
    }

    // check if max per account is being exceeded
    uint256 max = LibConfig.get(components, "MINT_MAX_PUBLIC");
    if (LibData.get(components, accID, 0, "MINT_NUM_PUBLIC") + amount > max) {
      revert("max public mint per account reached");
    }
  }

  // run validation checks on the whitelist mint
  function verifyAccWL(uint256 accID) internal {
    // check whether the account is whitelisted
    if (!LibFlag.has(components, accID, "MINT_WHITELISTED")) revert("not whitelisted");

    // check if whitelist mint has started
    if (block.timestamp < LibConfig.get(components, "MINT_START_WL")) {
      revert("whitelist mint has not yet started");
    }

    // check if max per account is being exceeded
    uint256 max = LibConfig.get(components, "MINT_MAX_WL");
    if (LibData.get(components, accID, 0, "MINT_NUM_WL") + 1 > max) {
      revert("max whitelist mint per account reached");
    }
  }
}
