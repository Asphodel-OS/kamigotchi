// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import "tests/utils/SetupTemplate.t.sol";

import { LibQuery, QueryFragment, QueryType } from "solecs/LibQuery.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";

contract BonusUponEndsTest is SetupTemplate {
  uint[] internal _nodeIDs;
  mapping(uint => uint[]) internal _kamiIDs;

  function setUp() public override {
    super.setUp();
  }

  /////////////////
  // TESTS

  function testBonusUponCrime() public {
    // setup
    uint256 uponDeathID = uint256(keccak256(abi.encodePacked("bonus.1")));
    uint256 uponKillID = uint256(keccak256(abi.encodePacked("bonus.2")));
    uint256 uponKillOrKilledID = uint256(keccak256(abi.encodePacked("bonus.3")));
    _createBonus(uponDeathID, "UPON_DEATH", "UPON_DEATH", 0, 1);
    _createBonus(uponKillID, "UPON_LIQUIDATION", "UPON_LIQUIDATION", 0, 1);
    _createBonus(uponKillOrKilledID, "UPON_KILL_OR_KILLED", "UPON_KILL_OR_KILLED", 0, 1);

    uint256 victimID = _mintKami(alice);
    uint256 killerID = _mintKami(bob);
    _fastForward(_idleRequirement);

    // set up victim
    _assignTemp(uponDeathID, victimID);
    _assignTemp(uponKillOrKilledID, victimID);
    uint256 aProdID = _startHarvest(victimID, 1);
    _fastForward(24 hours);

    // killer gets bonus, murders
    _assignTemp(uponKillID, killerID);
    _assignTemp(uponKillOrKilledID, killerID);
    uint256 bProdID = _startHarvest(killerID, 1);
    _fastForward(_idleRequirement);

    // verify pre-crime balances
    assertEq(LibBonus.getFor(components, "UPON_DEATH", victimID), 1);
    assertEq(LibBonus.getFor(components, "UPON_KILL_OR_KILLED", victimID), 1);
    assertEq(LibBonus.getFor(components, "UPON_LIQUIDATION", killerID), 1);
    assertEq(LibBonus.getFor(components, "UPON_KILL_OR_KILLED", killerID), 1);

    // commit said crime
    _liquidateHarvest(killerID, aProdID);

    // verify post-crime balances
    assertEq(LibBonus.getFor(components, "UPON_DEATH", victimID), 0);
    assertEq(LibBonus.getFor(components, "UPON_KILL_OR_KILLED", victimID), 0);
    assertEq(LibBonus.getFor(components, "UPON_LIQUIDATION", killerID), 0);
    assertEq(LibBonus.getFor(components, "UPON_KILL_OR_KILLED", killerID), 0);
  }

  /////////////////
  // UTILS

  function _createBonus(
    uint256 anchorID,
    string memory type_,
    string memory endAnchor,
    uint256 duration,
    int256 value
  ) internal returns (uint256 regID) {
    vm.startPrank(deployer);
    regID = LibBonus.regCreate(components, 0, anchorID, type_, endAnchor, duration, value);
    vm.stopPrank();
  }

  function _assignTemp(
    uint256 regAnchorID,
    uint256 holderID
  ) internal returns (uint256[] memory instanceID) {
    vm.startPrank(deployer);
    instanceID = LibBonus.assignTemporary(components, regAnchorID, holderID);
    vm.stopPrank();
  }

  function _assignPerm(
    uint256 regAnchorID,
    uint256 anchorID,
    uint256 holderID
  ) internal returns (uint256[] memory instanceID) {
    vm.startPrank(deployer);
    instanceID = LibBonus.incBy(components, regAnchorID, anchorID, holderID, 1);
    vm.stopPrank();
  }
}
