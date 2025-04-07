// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import "tests/utils/SetupTemplate.t.sol";

contract LibGetterTest is SetupTemplate {
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

  function testGetCooldown() public {
    uint256 entityID = uint256(keccak256(abi.encodePacked("test.entity")));
    vm.startPrank(deployer);
    LibCooldown.start(components, entityID);
    vm.stopPrank();

    // on cooldown
    assertTrue(LibGetter.getBool(components, entityID, "COOLDOWN", 0, 0));

    // still on cooldown
    _fastForward(1);
    assertTrue(LibGetter.getBool(components, entityID, "COOLDOWN", 0, 0));

    // off cooldown
    _fastForward(_idleRequirement);
    assertFalse(LibGetter.getBool(components, entityID, "COOLDOWN", 0, 0));
  }

  function testGetDataBal(uint256 amt, uint32 index) public {
    string memory type_ = "BLAHBLAHBLAH";

    vm.startPrank(deployer);
    uint256 dataID = LibData.getID(defaultAccID, index, type_);
    LibData.set(components, defaultAccID, index, type_, amt);
    vm.stopPrank();

    assertEq(LibGetter.getBal(components, defaultAccID, type_, index), amt);
  }

  function testGetItemBal(uint256 amt, uint32 index) public {
    vm.assume(index != 0);

    vm.startPrank(deployer);
    uint256 invID = LibInventory.create(components, defaultAccID, index);
    LibInventory.incFor(components, defaultAccID, index, amt);
    vm.stopPrank();

    assertEq(LibGetter.getBal(components, defaultAccID, "ITEM", index), amt);
  }

  function testGetFlag() public {
    vm.startPrank(deployer);
    uint256 entityID = uint256(keccak256(abi.encodePacked("test.entity")));
    LibFlag.set(components, entityID, "TEST_FLAG", true);
    vm.stopPrank();

    assertTrue(LibGetter.getBool(components, entityID, "TEST_FLAG", 0, 0));
    assertFalse(LibGetter.getBool(components, entityID, "TEST_FLAG_NOT", 0, 0));
  }

  function testGetLevel(uint256 amt) public {
    vm.startPrank(deployer);
    LibExperience.setLevel(components, defaultAccID, amt);
    vm.stopPrank();

    assertEq(LibGetter.getBal(components, defaultAccID, "LEVEL", 0), amt);
  }

  function testGetNumKamis() public {
    uint256 amt = 10;
    _mintKamis(defaultAccIndex, amt);

    assertEq(LibGetter.getBal(components, defaultAccID, "KAMI_NUM_OWNED", 0), amt);
  }

  function testGetKamiHighestLevel() public {
    uint256[] memory kamis = _mintKamis(defaultAccIndex, 10);
    vm.startPrank(deployer);
    LibExperience.setLevel(components, kamis[0], 100);
    LibExperience.setLevel(components, kamis[1], 101);
    LibExperience.setLevel(components, kamis[4], 104);
    LibExperience.setLevel(components, kamis[5], 105);
    LibExperience.setLevel(components, kamis[8], 108);
    LibExperience.setLevel(components, kamis[9], 111);
    vm.stopPrank();

    assertEq(LibGetter.getBal(components, defaultAccID, "KAMI_LEVEL_HIGHEST", 111), 111);
  }

  function testGetSkillLevel(uint32 index, uint256 holderID, uint256 amt) public {
    vm.assume(index > 0);
    vm.assume(holderID > 0);

    vm.startPrank(deployer);
    uint256 skillID = LibSkill.assign(components, index, holderID);
    LibSkill.setPoints(components, skillID, amt);
    vm.stopPrank();

    assertEq(LibGetter.getBal(components, holderID, "SKILL", index), amt);
  }
}
