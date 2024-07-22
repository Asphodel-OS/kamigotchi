// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "test/utils/SetupTemplate.t.sol";

contract LibConditionalTest is SetupTemplate {
  uint256 defaultAccIndex = 0;
  uint256 defaultAccID;
  address defaultOperator;
  address defaultOwner;

  function setUp() public override {
    super.setUp();

    defaultOwner = _getOwner(defaultAccIndex);
    defaultOperator = _getOperator(defaultAccIndex);
    defaultAccID = _getAccount(defaultAccIndex);
  }

  function testGetBalanceOfData(uint256 amt, uint32 index) public {
    string memory type_ = "BLAHBLAHBLAH";

    vm.startPrank(deployer);
    uint256 dataID = LibData.getID(defaultAccID, index, type_);
    LibData.set(components, defaultAccID, index, type_, amt);
    vm.stopPrank();

    assertEq(LibGetter.getBalanceOf(components, defaultAccID, type_, index), amt);
  }

  function testGetBalanceOfItem(uint256 amt, uint32 index) public {
    vm.assume(index != 0);

    vm.startPrank(deployer);
    uint256 invID = LibInventory.create(components, defaultAccID, index);
    LibInventory.inc(components, invID, amt);
    vm.stopPrank();

    assertEq(LibGetter.getBalanceOf(components, defaultAccID, "ITEM", index), amt);
  }

  function testGetBalanceOfCoin(uint256 amt) public {
    vm.startPrank(deployer);
    LibInventory.setFor(components, defaultAccID, MUSU_INDEX, amt);
    vm.stopPrank();

    assertEq(LibGetter.getBalanceOf(components, defaultAccID, "ITEM", MUSU_INDEX), amt);
  }

  function testGetBalanceOfLevel(uint256 amt) public {
    vm.startPrank(deployer);
    LibExperience.setLevel(components, defaultAccID, amt);
    vm.stopPrank();

    assertEq(LibGetter.getBalanceOf(components, defaultAccID, "LEVEL", 0), amt);
  }

  function testGetBalanceOfKamis(uint256 amt) public {
    vm.assume(amt < 100);

    if (amt > 0) _mintPets(defaultAccIndex, amt);

    assertEq(LibGetter.getBalanceOf(components, defaultAccID, "KAMI", 0), amt);
  }

  function testGetBalanceOfKamiHighestLevel() public {
    uint256[] memory kamis = _mintPets(defaultAccIndex, 25);
    vm.startPrank(deployer);
    LibExperience.setLevel(components, kamis[0], 100);
    LibExperience.setLevel(components, kamis[1], 101);
    LibExperience.setLevel(components, kamis[4], 104);
    LibExperience.setLevel(components, kamis[5], 105);
    LibExperience.setLevel(components, kamis[8], 108);
    LibExperience.setLevel(components, kamis[9], 111);
    vm.stopPrank();

    assertEq(LibGetter.getBalanceOf(components, defaultAccID, "KAMI_LEVEL_HIGHEST", 111), 111);
  }

  function testGetBalanceOfSkill(uint32 index, uint256 holderID, uint256 amt) public {
    vm.assume(index > 0);
    vm.assume(holderID > 0);

    vm.startPrank(deployer);
    uint256 skillID = LibSkill.create(components, holderID, index);
    LibSkill.setPoints(components, skillID, amt);
    vm.stopPrank();

    assertEq(LibGetter.getBalanceOf(components, holderID, "SKILL", index), amt);
  }
}
