// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import "tests/utils/SetupTemplate.t.sol";

contract ConditionalTest is SetupTemplate {
  Wrapper wrapper;
  uint256[] conditions;
  uint256 anchorID;

  function setUp() public override {
    super.setUp();
    wrapper = new Wrapper();
  }

  function testConditionalShape() public {
    /// creating

    uint256 conID = _create("ITEM", "CURR_MIN", 0, 1, "", anchorID);
    assertTrue(_TypeComponent.has(conID));
    assertTrue(_LogicTypeComponent.has(conID));
    assertFalse(_IndexComponent.has(conID)); // index was 0, skipped
    assertTrue(_ValueComponent.has(conID));
    assertFalse(_ForComponent.has(conID)); // for was empty, skipped

    uint256 conID2 = _create("ITEM", "CURR_MIN", 1, 0, "for", anchorID);
    assertTrue(_TypeComponent.has(conID2));
    assertTrue(_LogicTypeComponent.has(conID2));
    assertTrue(_IndexComponent.has(conID2));
    assertFalse(_ValueComponent.has(conID2)); // value was 0, skipped
    assertTrue(_ForComponent.has(conID2));

    /// querying

    uint256[] memory queryIDs = LibConditional.queryFor(components, anchorID);
    assertEq(queryIDs.length, 2);
    assertEq(queryIDs[0], conID);
    assertEq(queryIDs[1], conID2);

    /// deleting

    vm.startPrank(deployer);
    LibConditional.remove(components, conID);
    assertFalse(_TypeComponent.has(conID));
    assertFalse(_LogicTypeComponent.has(conID));
    assertFalse(_IndexComponent.has(conID));
    assertFalse(_ValueComponent.has(conID));
    assertFalse(_ForComponent.has(conID));

    LibConditional.remove(components, conID2);
    assertFalse(_TypeComponent.has(conID2));
    assertFalse(_LogicTypeComponent.has(conID2));
    assertFalse(_IndexComponent.has(conID2));
    assertFalse(_ValueComponent.has(conID2));
    assertFalse(_ForComponent.has(conID2));
  }

  function testConditionalForShapeParse() public {
    uint256 kamiID = _mintKami(alice);
    Condition memory data = Condition("type", "logic", 3, 5, "for");

    data.for_ = "ACCOUNT";
    uint256 id = LibConditional.parseTargetShape(components, alice.id, data.for_);
    assertEq(id, alice.id);
    id = LibConditional.parseTargetShape(components, kamiID, data.for_);
    assertEq(id, alice.id);

    data.for_ = "ROOM";
    id = LibConditional.parseTargetShape(components, alice.id, data.for_);
    assertEq(id, LibRoom.getByIndex(components, 1));
    id = LibConditional.parseTargetShape(components, kamiID, data.for_);
    assertEq(id, LibRoom.getByIndex(components, 1));

    data.for_ = "KAMI";
    vm.expectRevert("LibCon: invalid for (exp kami, not kami)");
    wrapper.parseTargetShape(components, alice.id, data.for_);
    id = LibConditional.parseTargetShape(components, kamiID, data.for_);
    assertEq(id, kamiID);

    data.for_ = "FOO";
    vm.expectRevert("LibCon: invalid for shape");
    wrapper.parseTargetShape(components, alice.id, data.for_);
  }

  function testConditionalForShapeSingle() public {
    uint256 kamiID = _mintKami(alice);
    uint256 accCond = _create("ITEM", "CURR_MIN", 1, 1, "ACCOUNT", anchorID);
    conditions.push(accCond);
    uint256 kamiCond = _create("STATE", "BOOL_IS", 1, 1, "KAMI", anchorID);
    conditions.push(kamiCond);
    _giveItem(alice, 1, 1);

    // check accCond
    uint256[] memory singleCond = new uint256[](1);
    singleCond[0] = accCond;
    assertTrue(LibConditional.check(components, singleCond, alice.id));
    assertTrue(LibConditional.check(components, singleCond, kamiID));

    // check petCond (kami resting)
    singleCond[0] = kamiCond;
    assertTrue(LibConditional.check(components, singleCond, kamiID));

    // check both via kami
    assertTrue(LibConditional.check(components, conditions, kamiID));
  }

  /////////////////
  // SPECIFIC CHECKS

  function testConditionalRoomFlag() public {
    uint256 cond = _create("TEST_FLAG", "BOOL_IS", 0, 0, "ROOM", anchorID);
    conditions.push(cond);
    _createRoomFlag(1, "TEST_FLAG");
    _createRoomFlag(3, "TEST_FLAG_NOT");

    _moveAccount(alice, 1);
    assertTrue(LibConditional.check(components, conditions, alice.id), "room 1 fail"); // room 1
    _moveAccount(alice, 2);
    assertFalse(LibConditional.check(components, conditions, alice.id), "room 2 fail"); // room 2
    _moveAccount(alice, 3);
    assertFalse(LibConditional.check(components, conditions, alice.id), "room 3 fail"); // room 3
  }

  /////////////////
  // UTILS

  function _create(
    string memory type_,
    string memory logic,
    uint32 index,
    uint256 value,
    string memory for_,
    uint256 _anchorID
  ) internal returns (uint256 id) {
    vm.startPrank(deployer);
    id = LibConditional.createFor(
      world,
      components,
      Condition(type_, logic, index, value, for_),
      _anchorID
    );
    vm.stopPrank();
  }
}

contract Wrapper {
  function parseTargetShape(
    IUint256Component components,
    uint256 targetID,
    string memory forShape
  ) public returns (uint256) {
    return LibConditional.parseTargetShape(components, targetID, forShape);
  }
}
