// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import "tests/utils/SetupTemplate.t.sol";

import { TraitStats } from "libraries/LibTraitRegistry.sol";
import { GACHA_ID } from "libraries/LibGacha.sol";
import { GACHA_TICKET_INDEX, REROLL_TICKET_INDEX } from "libraries/LibInventory.sol";

struct KamiTraits {
  uint32 face;
  uint32 hand;
  uint32 body;
  uint32 background;
  uint32 color;
}

contract MintTemplate is SetupTemplate {
  mapping(string => mapping(uint32 => TraitStats)) internal _traitStats;

  function setUp() public virtual override {
    super.setUp();

    vm.roll(_currBlock++);
    vm.roll(_currBlock++);
  }

  function setUpMint() public virtual override {}

  function setUpTraits() public virtual override {}

  function _initBasicTraits() internal {
    // index, health, power, violence, harmony, slots, rarity, affinity, name, type
    registerTrait(0, 10, 0, 0, 0, 0, 9, "", "BG", "BACKGROUND");
    _traitStats["BACKGROUND"][0] = TraitStats(10, 0, 0, 0, 0);
    registerTrait(0, 0, 2, 0, 0, 0, 9, "INSECT", "BODY", "BODY");
    _traitStats["BODY"][0] = TraitStats(0, 2, 0, 0, 0);
    registerTrait(0, 0, 0, 3, 0, 0, 9, "", "COLOR", "COLOR");
    _traitStats["COLOR"][0] = TraitStats(0, 0, 3, 0, 0);
    registerTrait(0, 0, 0, 0, 5, 0, 9, "", "FACE", "FACE");
    _traitStats["FACE"][0] = TraitStats(0, 0, 0, 5, 0);
    registerTrait(0, 0, 0, 0, 0, 7, 9, "NORMAL", "HAND", "HAND");
    _traitStats["HAND"][0] = TraitStats(0, 0, 0, 0, 7);
  }

  /////////////////
  // ASSERTIONS

  function assertEq(uint256 kamiID, TraitStats memory expected) public view {
    assertEq(LibStat.getTotal(components, "HEALTH", kamiID), expected.health, "health mismatch");
    assertEq(LibStat.getTotal(components, "POWER", kamiID), expected.power, "power mismatch");
    assertEq(
      LibStat.getTotal(components, "VIOLENCE", kamiID),
      expected.violence,
      "violence mismatch"
    );
    assertEq(LibStat.getTotal(components, "HARMONY", kamiID), expected.harmony, "harmony mismatch");
    assertEq(LibStat.getTotal(components, "SLOTS", kamiID), expected.slots, "slots mismatch");
  }

  /////////////////
  // CALCS

  /// @notice uses saved test mappings
  function calcExpectedStats(uint32[] memory traits) internal view returns (TraitStats memory) {
    TraitStats memory base = getBaseStats();
    string[] memory types = getTraitNames();
    for (uint256 i; i < 5; i++) {
      TraitStats memory delta = _traitStats[types[i]][traits[i]];
      base = LibTraitRegistry.addStats(base, delta);
    }
    return base;
  }

  function calcExpectedStats(KamiTraits memory traits) internal view returns (TraitStats memory) {
    return calcExpectedStats(traitStructToArr(traits));
  }

  /////////////////
  // UTILS

  function _batchMint(uint256 amount) internal returns (uint256[] memory results) {
    vm.startPrank(deployer);
    __721BatchMinterSystem.setTraits();
    results = __721BatchMinterSystem.batchMint(amount);
    vm.stopPrank();
  }

  function traitStructToArr(KamiTraits memory traits) internal pure returns (uint32[] memory) {
    uint32[] memory arr = new uint32[](5);
    arr[0] = traits.face;
    arr[1] = traits.hand;
    arr[2] = traits.body;
    arr[3] = traits.background;
    arr[4] = traits.color;
    return arr;
  }

  function traitArrToStruct(uint32[] memory arr) internal pure returns (KamiTraits memory) {
    KamiTraits memory traits;
    traits.face = arr[0];
    traits.hand = arr[1];
    traits.body = arr[2];
    traits.background = arr[3];
    traits.color = arr[4];
    return traits;
  }

  /////////////////
  // CONSTANTS

  function getBaseStats() internal pure returns (TraitStats memory) {
    return TraitStats(50, 10, 10, 10, 0);
  }

  function getTraitNames() internal pure returns (string[] memory) {
    return LibTraitRegistry.getTypeNames();
  }
}
