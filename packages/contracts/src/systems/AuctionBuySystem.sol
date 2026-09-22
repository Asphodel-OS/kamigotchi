// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibAuction } from "libraries/LibAuction.sol";
import { LibAuctionRegistry } from "libraries/LibAuctionRegistry.sol";
import { LibGacha } from "libraries/LibGacha.sol";
import { LibInventory, GACHA_TICKET_INDEX, REROLL_TICKET_INDEX } from "libraries/LibInventory.sol";
import { LibKamiCreate } from "libraries/LibKamiCreate.sol";

uint256 constant ID = uint256(keccak256("system.auction.buy"));

// this currently supports at most one global auction specified per item
contract AuctionBuySystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint32 itemIndex, uint32 amt) = abi.decode(arguments, (uint32, uint32));

    uint256 accID = LibAccount.verifyOwner(components);
    uint256 id = LibAuction.verifyBuyParams(components, itemIndex, amt);
    LibAuction.verifyRequirements(components, id, accID);

    // tickets are worthless once nothing can be drawn, so stop selling them at that point.
    // deliberately not rationed against the pool: tickets held by inactive players must
    // not lock kamis, so surplus tickets bought at the very end simply go unused
    if (itemIndex == GACHA_TICKET_INDEX) {
      require(
        LibGacha.getNumFree(components) + LibKamiCreate.getSupplyHeadroom(components) > 0,
        "gacha pool exhausted"
      );
    } else if (itemIndex == REROLL_TICKET_INDEX) {
      require(LibGacha.getNumFree(components) > 0, "gacha pool exhausted");
    }

    // process the buy
    uint256 cost = LibAuction.calcBuy(components, id, amt);
    uint32 payItemIndex = LibAuctionRegistry.getCurrencyIndex(components, id);
    LibInventory.decFor(components, accID, payItemIndex, cost);
    LibInventory.incFor(components, accID, itemIndex, amt);
    LibAuction.incBalance(components, id, amt);

    // enable logging to support historic sales date + price history
    LibAuction.logBuy(
      world,
      components,
      accID,
      LibAuction.BuyLog(itemIndex, amt, payItemIndex, cost)
    );

    LibAccount.updateLastTs(components, accID);
    return "";
  }

  function executeTyped(uint32 itemIndex, uint32 amt) public returns (bytes memory) {
    return execute(abi.encode(itemIndex, amt));
  }
}
