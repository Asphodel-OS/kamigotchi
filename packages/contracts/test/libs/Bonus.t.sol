// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { LibSort } from "solady/utils/LibSort.sol";

import "tests/utils/SetupTemplate.t.sol";

contract BonusTest is SetupTemplate {
  uint256 constant regParentEntity = uint256(keccak256(abi.encodePacked("parent")));
  uint256 constant regParentEntity2 = uint256(keccak256(abi.encodePacked("parent2")));
  uint256 constant holderEntity = uint256(keccak256(abi.encodePacked("holder")));
  uint256 constant holderEntity2 = uint256(keccak256(abi.encodePacked("holder2")));
  uint256 constant holderAnchor = uint256(keccak256(abi.encodePacked("holderAnchor")));
  uint256 constant holderAnchor2 = uint256(keccak256(abi.encodePacked("holderAnchor2")));

  uint256 internal parentCounter;

  function setUp() public override {
    setUpWorld();

    vm.startPrank(deployer);
  }

  /////////////////
  // SHAPES

  function testBonusShape() public {
    uint256 regID = _createRegistry(regParentEntity, "BONUS_TYPE", "", 0, 1);

    // assigning to holder
    uint256 instanceID = LibBonus.assign(components, regID, holderAnchor, holderEntity);
    _incBy(regParentEntity, holderAnchor, holderEntity, 1);
    assertEq(LibBonus.getFor(components, "BONUS_TYPE", holderEntity), 1);
    _assertInstanceShape(instanceID);

    // assigning to holder2
    _incBy(regParentEntity, holderAnchor2, holderEntity2, 2);
    assertEq(LibBonus.getFor(components, "BONUS_TYPE", holderEntity2), 2);

    // unassigning holder
    LibBonus.unassign(components, instanceID);
    assertEq(LibBonus.getFor(components, "BONUS_TYPE", holderEntity), 0);
    _assertInstanceNoShape(instanceID);
  }

  function testBonusTempActionShape() public {
    uint256 tempRegID = _createRegistry(regParentEntity, "TEMP_BONUS", "UPON_HARVEST_ACTION", 0, 3);

    // assigning to holder
    _incTemp(regParentEntity, holderEntity);
    assertEq(LibBonus.getFor(components, "TEMP_BONUS", holderEntity), 3);

    // assigning again, temp bonus should not stack
    _incTemp(regParentEntity, holderEntity);
    assertEq(LibBonus.getFor(components, "TEMP_BONUS", holderEntity), 3);

    // do action, remove temporary bonus
    LibBonus.unassignBy(components, "UPON_HARVEST_ACTION", holderEntity);
    assertEq(LibBonus.getFor(components, "TEMP_BONUS", holderEntity), 0);
  }

  function testBonusTempInteractions() public {
    uint256 regParentTemp = uint256(keccak256(abi.encodePacked("temp")));
    uint256 regParentPerm = uint256(keccak256(abi.encodePacked("perm")));
    _createRegistry(regParentTemp, "BONUS_TYPE", "UPON_HARVEST_ACTION", 0, 3);
    _createRegistry(regParentPerm, "BONUS_TYPE", "", 0, 2);

    // assigning temp once
    _incTemp(regParentTemp, holderEntity);
    assertEq(LibBonus.getFor(components, "BONUS_TYPE", holderEntity), 3);

    // assigning again, temp bonus should not stack
    _incTemp(regParentTemp, holderEntity);
    assertEq(LibBonus.getFor(components, "BONUS_TYPE", holderEntity), 3);

    // removing temp, reset to 0
    LibBonus.unassignBy(components, "UPON_HARVEST_ACTION", holderEntity);
    assertEq(LibBonus.getFor(components, "BONUS_TYPE", holderEntity), 0);

    // assigning temp and perm, then temp again
    _incTemp(regParentTemp, holderEntity);
    _incBy(regParentPerm, holderAnchor, holderEntity, 1);
    assertEq(LibBonus.getFor(components, "BONUS_TYPE", holderEntity), 5);
    _incTemp(regParentTemp, holderEntity);
    assertEq(LibBonus.getFor(components, "BONUS_TYPE", holderEntity), 5); // temp does not stack, stays the same

    // removing temp, reset to 2 (perm)
    LibBonus.unassignBy(components, "UPON_HARVEST_ACTION", holderEntity);
    assertEq(LibBonus.getFor(components, "BONUS_TYPE", holderEntity), 2);
  }

  /////////////////
  // QUERIES

  function testBonusQuery() public {
    uint256[] memory ofParent1 = new uint256[](3);
    uint256[] memory ofParent2 = new uint256[](2);
    uint256[] memory ofType1 = new uint256[](2);
    uint256[] memory ofType2 = new uint256[](1);
    uint256 localParent = uint256(keccak256(abi.encode(regParentEntity))); // insntance parent, eg. skill instance
    uint256 localParent2 = uint256(keccak256(abi.encode(regParentEntity2))); // insntance parent, eg. skill instance
    uint256 regParent = uint256(keccak256(abi.encode("registry.1"))); // registry parent, eg. skill registry
    uint256 regParent2 = uint256(keccak256(abi.encode("registry.2"))); // registry parent, eg. skill registry

    uint256 tempID = _createRegistry(regParent, _genType(1), "", 0, 1);
    ofParent1[0] = tempID;
    ofType1[0] = tempID;
    tempID = _createRegistry(regParent, _genType(3), "", 0, 2);
    ofParent1[1] = tempID;
    // not checking for type 3
    tempID = _createRegistry(regParent, _genType(4), "", 0, 3);
    ofParent1[2] = tempID;
    // not checking for type 4
    tempID = _createRegistry(regParent2, _genType(1), "", 0, 4);
    ofParent2[0] = tempID;
    ofType1[1] = tempID;
    tempID = _createRegistry(regParent2, _genType(2), "", 0, 5);
    ofParent2[1] = tempID;
    ofType2[0] = tempID;
    LibSort.insertionSort(ofParent1);
    LibSort.insertionSort(ofParent2);
    LibSort.insertionSort(ofType1);
    LibSort.insertionSort(ofType2);

    // check registry queries
    {
      uint256[] memory regQueriedParent1 = LibBonus.queryByParent(components, regParent);
      uint256[] memory regQueriedParent2 = LibBonus.queryByParent(components, regParent2);
      assertEq(ofParent1.length, regQueriedParent1.length, "reg parent1 length mismatch");
      assertEq(ofParent2.length, regQueriedParent2.length, "reg parent2 length mismatch");
      LibSort.insertionSort(regQueriedParent1);
      LibSort.insertionSort(regQueriedParent2);
      for (uint256 i; i < regQueriedParent1.length; i++)
        assertEq(regQueriedParent1[i], ofParent1[i], "reg parent1 mismatch");
      for (uint256 i; i < regQueriedParent2.length; i++)
        assertEq(regQueriedParent2[i], ofParent2[i], "reg parent2 mismatch");
    }

    // assigning
    _incBy(regParent, localParent, holderEntity, 1);
    _incBy(regParent2, localParent2, holderEntity, 1);

    // querying
    {
      uint256[] memory queriedParent1 = _getSource(LibBonus.queryByParent(components, localParent));
      uint256[] memory queriedParent2 = _getSource(
        LibBonus.queryByParent(components, localParent2)
      );
      uint256[] memory queriedType1 = _getSource(_queryByType(_genType(1), holderEntity));
      uint256[] memory queriedType2 = _getSource(_queryByType(_genType(2), holderEntity));
      LibSort.insertionSort(queriedParent1);
      LibSort.insertionSort(queriedParent2);
      LibSort.insertionSort(queriedType1);
      LibSort.insertionSort(queriedType2);

      // assertions
      assertEq(ofParent1.length, queriedParent1.length, "parent1 length mismatch");
      assertEq(ofParent2.length, queriedParent2.length, "parent2 length mismatch");
      assertEq(ofType1.length, queriedType1.length, "type1 length mismatch");
      assertEq(ofType2.length, queriedType2.length, "type2 length mismatch");
      for (uint256 i; i < ofParent1.length; i++)
        assertEq(ofParent1[i], queriedParent1[i], "parent1 mismatch");
      for (uint256 i; i < ofParent2.length; i++)
        assertEq(ofParent2[i], queriedParent2[i], "parent2 mismatch");
      for (uint256 i; i < ofType1.length; i++)
        assertEq(ofType1[i], queriedType1[i], "type1 mismatch");
      for (uint256 i; i < ofType2.length; i++)
        assertEq(ofType2[i], queriedType2[i], "type2 mismatch");
    }
  }

  function testBonusDiffTypesSameParent() public {
    int256[] memory values = new int256[](6);
    values[0] = 2;
    values[1] = 7;
    values[2] = 11;
    values[3] = 0;
    values[4] = -3;
    values[5] = -5;
    uint256[] memory levels = new uint256[](6);
    levels[0] = 1;
    levels[1] = 1;
    levels[2] = 2;
    levels[3] = 3;
    levels[4] = 3;
    levels[5] = 1;
    uint256[] memory regIDs = new uint256[](6);
    for (uint256 i; i < 6; i++)
      regIDs[i] = _createRegistry(regParentEntity, _genType(i), "", 0, values[i]);

    // asserting parent query
    {
      uint256[] memory childIDs = LibBonus.queryByParent(components, regParentEntity);
      assertEq(childIDs.length, regIDs.length, "parent query mismatch");
      for (uint256 i; i < childIDs.length; i++)
        assertEq(childIDs[i], regIDs[i], "individual parent query mismatch");
    }

    // forcefully assigning one to holder prior
    _setBonusLevel(LibBonus.assign(components, regIDs[0], holderAnchor, holderEntity), 1);
    assertEq(LibBonus.getFor(components, _genType(0), holderEntity), 2, "type 0 mismatch");
    assertEq(_queryByType(_genType(0), holderEntity).length, 1, "type 0 length mismatch");
    assertEq(_queryByType(_genType(1), holderEntity).length, 0, "type 1 length mismatch");

    // assigning to holder
    _incBy(regParentEntity, holderAnchor, holderEntity, 1);

    // setting levels
    for (uint256 i; i < regIDs.length; i++)
      _setBonusLevel(LibBonus.genInstanceID(regIDs[i], holderEntity, 0), levels[i]);

    // checking total
    for (uint256 i; i < regIDs.length; i++) {
      assertEq(
        LibBonus.getFor(components, _genType(i), holderEntity),
        LibBonus.calcSingle(uint256(values[i]), levels[i]),
        LibString.concat(_genType(i), " total mismatch")
      );
    }
  }

  function testBonusDiffParentSameType() public {
    int256[] memory values = new int256[](6);
    values[0] = 2;
    values[1] = 7;
    values[2] = 11;
    values[3] = 0;
    values[4] = -3;
    values[5] = -5;
    uint256[] memory levels = new uint256[](6);
    levels[0] = 1;
    levels[1] = 1;
    levels[2] = 2;
    levels[3] = 3;
    levels[4] = 3;
    levels[5] = 1;
    uint256[] memory regAnchorIDs = new uint256[](6);
    for (uint256 i; i < 6; i++) {
      regAnchorIDs[i] = _genParentEntity();
      _createRegistry(regAnchorIDs[i], "BONUS_TYPE", "", 0, values[i]);
    }

    // assigning from parents
    for (uint256 i; i < 6; i++) _incBy(regAnchorIDs[i], holderAnchor, holderEntity, levels[i]);

    // asserting total
    assertEq(
      LibBonus.getFor(components, "BONUS_TYPE", holderEntity),
      _sum(values, levels),
      "total mismatch"
    );
  }

  /////////////////
  // UTILS

  function _createRegistry(
    uint256 anchorID,
    string memory type_,
    string memory endAnchor, // leave blank if permanent
    uint256 duration, // leave blank if not timed
    int256 value
  ) internal returns (uint256 id) {
    // vm.startPrank(deployer);
    id = LibBonus.regCreate(components, anchorID, type_, endAnchor, duration, value);
    // vm.stopPrank();
  }

  function _incBy(uint256 regAnchorID, uint256 anchorID, uint256 holderID, uint256 amt) internal {
    // vm.startPrank(deployer);
    LibBonus.incBy(components, regAnchorID, anchorID, holderID, amt);
    // vm.stopPrank();
  }

  function _incTemp(uint256 regAnchorID, uint256 holderID) internal {
    LibBonus.assignTemporary(components, regAnchorID, holderID);
  }

  function _genParentEntity() internal returns (uint256) {
    return uint256(keccak256(abi.encodePacked("parent", parentCounter++)));
  }

  function _genType(uint256 index) internal pure returns (string memory) {
    return LibString.concat("BONUS_TYPE_", LibString.toString(index));
  }

  function _getSource(uint256 id) internal view returns (uint256) {
    return _IdSourceComponent.get(id);
  }

  function _getSource(uint256[] memory ids) internal view returns (uint256[] memory) {
    return _IdSourceComponent.get(ids);
  }

  function _setBonusLevel(uint256 id, uint256 level) internal {
    _LevelComponent.set(id, level);
  }

  function _queryByType(
    string memory type_,
    uint256 holderID
  ) internal view returns (uint256[] memory) {
    return LibBonus.queryByType(components, type_, holderID);
  }

  function _sum(
    int256[] memory values,
    uint256[] memory levels
  ) internal pure returns (int256 total) {
    for (uint256 i; i < values.length; i++)
      total += LibBonus.calcSingle(uint256(values[i]), levels[i]);
  }

  /////////////////
  // ASSERTIONS

  function _assertInstanceShape(uint256 id) internal {
    assertTrue(_IdSourceComponent.has(id));
    assertTrue(_IDTypeComponent.has(id));
    assertTrue(_IDAnchorComponent.has(id));
    assertTrue(_LevelComponent.has(id));
  }

  function _assertInstanceNoShape(uint256 id) internal {
    assertFalse(_IdSourceComponent.has(id));
    assertFalse(_IDTypeComponent.has(id));
    assertFalse(_IDAnchorComponent.has(id));
    assertFalse(_LevelComponent.has(id));
  }
}
