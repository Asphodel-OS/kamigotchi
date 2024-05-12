// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";

import "test/utils/SetupTemplate.t.sol";

// TODO: test for correct production rates upon starting harvests
contract RecoveryTest is SetupTemplate {
  using SafeCastLib for int32;
  using SafeCastLib for uint256;

  ExternalCaller _externalCaller = new ExternalCaller();

  function setUp() public override {
    super.setUp();

    vm.startPrank(deployer);
    _HealthComponent.authorizeWriter(address(_externalCaller));
    _TimeLastComponent.authorizeWriter(address(_externalCaller));
    vm.stopPrank();
  }

  /////////////////
  // CALCS
  function _calcRecovery(
    uint256 rate,
    int256 bonus,
    uint256 timeDelta
  ) internal view returns (uint256) {
    uint32[8] memory configVals = LibConfig.getArray(components, "KAMI_REST_METABOLISM");

    uint256 precision = 10 ** uint256(configVals[0]);
    uint256 multPrecision = 10 ** uint256(configVals[3]);
    return (timeDelta * rate * _handlePercentBonus(bonus)) / (precision * multPrecision);
  }

  function _calcRate(uint256 harmony) internal view returns (uint256) {
    uint32[8] memory configVals = LibConfig.getArray(components, "KAMI_REST_METABOLISM");

    uint256 precision = 10 ** uint256(configVals[0]);
    uint256 base = uint256(configVals[1]);
    uint256 basePrecision = 10 ** uint256(configVals[2]);

    return (harmony * base * precision) / (3600 * basePrecision);
  }

  /////////////////
  // CALCULATION TESTS

  function testRecoveryCalcs(
    uint24 bHarmony,
    uint24 bHealth,
    uint24 bCurrHealth,
    uint32 timeDelta,
    int16 bonus
  ) public {
    int32 harmony = int32(int24(bHarmony));
    int32 health = int32(int24(bHealth));
    int32 currHealth = int32(int24(bCurrHealth));
    vm.assume(harmony > 0 && harmony < 2147483); // bounds for int32/1000
    vm.assume(health > 0 && health < 2147483); // bounds for int32/1000
    vm.assume(currHealth > 0 && currHealth <= health);
    vm.assume(bonus > -1111 && bonus < 1111); // expected bounds - will overfow otherwise

    // setup
    uint256 petID = _mintPet(0);
    vm.startPrank(deployer);
    _HarmonyComponent.set(petID, Stat(harmony, 0, 0, harmony));
    _HealthComponent.set(petID, Stat(health, 0, 0, currHealth));
    vm.stopPrank();
    if (bonus != 0) {
      vm.startPrank(deployer);
      LibBonus.inc(components, petID, "RESTING_RECOVERY", bonus);
      vm.stopPrank();
    }

    // checking recovery rate
    uint256 rate = _calcRate(harmony.toUint256());
<<<<<<< HEAD
<<<<<<< HEAD
    // assertEq(rate, LibPet.calcMetabolism(components, petID), "Rate calc mismatch");
=======
    assertEq(rate, LibPet.calcMetabolism(components, petID), "Rate calc mismatch");
>>>>>>> d9c80366 (refine kami heal logic)
=======
    // assertEq(rate, LibPet.calcMetabolism(components, petID), "Rate calc mismatch");
>>>>>>> 8ece43dc (cleanups)
    assertEq(
      0, // no time passed, should be 0
      LibPet.calcRecovery(components, petID),
      "Recovery calc 0 mismatch"
    );

    // to time
    _fastForward(timeDelta);

    // checking recovery rate - should be same as above
<<<<<<< HEAD
<<<<<<< HEAD
    // assertEq(rate, LibPet.calcMetabolism(components, petID), "Rate calc post mismatch");
=======
    assertEq(rate, LibPet.calcMetabolism(components, petID), "Rate calc post mismatch");
>>>>>>> d9c80366 (refine kami heal logic)
=======
    // assertEq(rate, LibPet.calcMetabolism(components, petID), "Rate calc post mismatch");
>>>>>>> 8ece43dc (cleanups)
    uint256 recovery = _calcRecovery(rate, bonus, timeDelta);
    assertEq(recovery, LibPet.calcRecovery(components, petID), "Recovery calc mismatch");

    if (currHealth.toUint256() + recovery >= (1 << 31)) {
      // overflow
      vm.prank(deployer);
      vm.expectRevert();
      _externalCaller.sync(components, petID);
    } else {
      vm.prank(deployer);
      _externalCaller.sync(components, petID);

      uint256 expectedHealth;
      if (currHealth.toUint256() + recovery >= health.toUint256())
        expectedHealth = health.toUint256();
      else expectedHealth = currHealth.toUint256() + recovery;

      assertEq(
        expectedHealth,
        _HealthComponent.get(petID).sync.toUint256(),
        "Health calc mismatch"
      );
    }
  }

  /////////////////
  // UTILS

  /// @notice handles % bonus manipulation (base value of 1000 bps)
  function _handlePercentBonus(int256 bonus) internal pure returns (uint256) {
    return bonus > -1000 ? uint256(bonus + 1000) : 1;
  }
}

// for public libraries to be called properly via prank
contract ExternalCaller {
  function sync(IUint256Component components, uint256 id) public {
    LibPet.sync(components, id);
  }
}
