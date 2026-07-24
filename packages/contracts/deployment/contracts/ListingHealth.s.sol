// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import "deployment/Imports.sol";
import { SystemCall } from "deployment/SystemCall.s.sol";
import { getAddrByID } from "solecs/utils.sol";

import { BalanceComponent, ID as BalanceCompID } from "components/BalanceComponent.sol";
import { PeriodComponent, ID as PeriodCompID } from "components/PeriodComponent.sol";
import { RateComponent, ID as RateCompID } from "components/RateComponent.sol";
import { TimeStartComponent, ID as TimeStartCompID } from "components/TimeStartComponent.sol";
import { ValueComponent, ID as ValueCompID } from "components/ValueComponent.sol";

import { LibListing } from "libraries/LibListing.sol";
import { LibListingRegistry } from "libraries/LibListingRegistry.sol";
import { console } from "forge-std/console.sol";

/** @notice
 * READ-ONLY health report for every GDA shop listing: schedule deficit and live
 * buy prices at several batch sizes. Run via `pnpm world:listings:health:<env>`
 * (never broadcasts). A deficit drifting past ~2 periods means the listing's rate
 * still exceeds real demand: cut the rate (data-only ceremony), no code change.
 *
 * The listing set below mirrors data/listings/listings.csv (In-game GDA rows);
 * keep it in sync when listings are added or retired.
 */
contract ListingHealth is SystemCall {
  function run(uint256, address worldAddr) external {
    _setUp(worldAddr);

    _read(1, 11001, "Mina Ribbon");
    _read(1, 11301, "Mina Gum");
    _read(1, 11303, "Mina Fruit Candy");
    _read(1, 11304, "Mina Cookie Sticks");
    _read(1, 21201, "Mina Ice Cream S");
    _read(1, 21202, "Mina Ice Cream M");
    _read(1, 21203, "Mina Ice Cream L");
    _read(2, 11001, "Vending Ribbon");
    _read(2, 11301, "Cave Gum");
    _read(2, 11303, "Cave Fruit Candy");
    _read(2, 11304, "Cave Cookie Sticks");
    _read(2, 21201, "Cave Ice Cream S");
    _read(2, 21202, "Cave Ice Cream M");
    _read(2, 21203, "Cave Ice Cream L");
  }

  function _read(uint32 npc, uint32 item, string memory label) internal view {
    uint256 id = LibListingRegistry.genID(npc, item);
    uint256 buyID = LibListingRegistry.genBuyID(id);

    uint256 ts = TimeStartComponent(getAddrByID(components, TimeStartCompID)).safeGet(id);
    if (ts == 0) {
      console.log("=== %s (npc %s item %s): NOT FOUND", label, npc, item);
      return;
    }
    int32 bal = BalanceComponent(getAddrByID(components, BalanceCompID)).safeGet(id);
    uint256 target = ValueComponent(getAddrByID(components, ValueCompID)).safeGet(id);
    int32 period = PeriodComponent(getAddrByID(components, PeriodCompID)).get(buyID);
    uint256 rate = RateComponent(getAddrByID(components, RateCompID)).get(buyID);

    console.log("=== %s (npc %s item %s)", label, npc, item);
    console.log("  target %s | rate/period %s | periodSec %s", target, rate, uint256(uint32(period)));
    console.log("  timeStart %s | sold %s", ts, uint256(uint32(bal)));

    // deficit in milli-periods: (t - n/r) * 1000
    uint256 elapsedMilli = ((block.timestamp - ts) * 1000) / uint256(uint32(period));
    uint256 soldMilli = (uint256(uint32(bal)) * 1000) / rate;
    if (elapsedMilli >= soldMilli) {
      console.log("  DEFICIT milli-periods: %s (behind schedule)", elapsedMilli - soldMilli);
    } else {
      console.log("  SURPLUS milli-periods: %s (ahead of schedule)", soldMilli - elapsedMilli);
    }

    _probe(id, 1, rate);
    _probe(id, 100, rate);
    _probe(id, 1000, rate);
  }

  // respect the batch bound so oversized probes print instead of reverting
  function _probe(uint256 id, uint256 amt, uint256 rate) internal view {
    if (amt > rate * 100) {
      console.log("  price x%s : (skipped, over batch bound)", amt);
      return;
    }
    console.log("  price x%s : %s", amt, LibListing.calcBuyPrice(components, id, amt));
  }
}
