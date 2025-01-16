// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import "./BaseTester.t.sol";

import { Coord, CoordLib } from "solecs/components/types/Coord.sol";
import { CoordComponent } from "solecs/components/CoordComponent.sol";

contract CoordCompTest is BaseTester {
  CoordComponent coordComp;

  function setUp() public override {
    super.setUp();

    coordComp = new CoordComponent(address(world), uint256(keccak256("test.Coord")));
    world.registerComponent(address(coordComp), uint256(keccak256("test.Coord")));
  }

  //////////////
  // COMPONENT

  function testCoordComponent() public {
    uint256 id = 111;
    uint256[] memory ids = new uint256[](1);
    ids[0] = id;
    Coord memory original = Coord(1, 2, 3);
    Coord[] memory ogBatch = new Coord[](1);
    ogBatch[0] = original;

    vm.prank(deployer);
    coordComp.set(id, original);

    // test getting
    assertEq(coordComp.get(id), original);
    vm.expectRevert();
    coordComp.get(1);
    assertEq(coordComp.get(ids), ogBatch);

    // test extract
    vm.prank(deployer);
    Coord memory extracted = coordComp.extract(id);
    assertEq(extracted, original);
    assertTrue(!coordComp.has(id));
    vm.expectRevert();
    coordComp.get(id);
    vm.prank(deployer);
    coordComp.set(id, original);
    vm.prank(deployer);
    assertEq(coordComp.extract(ids), ogBatch);
    assertEq(extracted, original);
    assertTrue(!coordComp.has(id));
    vm.expectRevert();
    coordComp.get(id);

    // test setting
    vm.prank(deployer);
    coordComp.set(id, original);
    assertEq(coordComp.get(id), original);
    ids = new uint256[](3);
    ids[0] = 1000;
    ids[1] = 1001;
    ids[2] = 1002;
    ogBatch = new Coord[](3);
    ogBatch[0] = Coord(10, 20, 30);
    ogBatch[1] = Coord(11, 21, 31);
    ogBatch[2] = Coord(12, 22, 32);
    vm.prank(deployer);
    coordComp.set(ids, ogBatch);
    for (uint256 i = 0; i < ids.length; i++) {
      assertEq(coordComp.get(ids[i]), ogBatch[i]);
    }
    assertEq(coordComp.get(ids), ogBatch);

    // test setting permissions
    vm.prank(address(1));
    vm.expectRevert();
    coordComp.set(0, Coord(1, 1, 1));
    Coord[] memory batch = new Coord[](2);
    batch[0] = Coord(1, 1, 1);
    batch[1] = Coord(2, 2, 2);
    vm.prank(address(1));
    vm.expectRevert();
    coordComp.set(ids, batch);

    // test removing permissions
    vm.prank(address(1));
    vm.expectRevert();
    coordComp.remove(id);
    vm.prank(address(1));
    vm.expectRevert();
    coordComp.remove(ids);

    // test extract permissions
    vm.prank(address(1));
    vm.expectRevert();
    coordComp.extract(id);
    vm.prank(address(1));
    vm.expectRevert();
    coordComp.extract(ids);
  }

  //////////////
  // ENCODING

  function testCoordLib(int32 x, int32 y, int32 z) public {
    Coord memory original = Coord(x, y, z);

    // test uint256 conversion
    uint256 converted = CoordLib.toUint(original);
    assertEq(CoordLib.toCoord(converted), original);

    // test abi encoding
    bytes memory encoded = CoordLib.encode(original);
    assertEq(CoordLib.decode(encoded), original);
  }

  //////////////
  // UTILS
  function assertEq(Coord memory a, Coord memory b) internal {
    assertEq(a.x, b.x);
    assertEq(a.y, b.y);
    assertEq(a.z, b.z);
  }

  function assertEq(Coord[] memory a, Coord[] memory b) internal {
    assertEq(a.length, b.length);
    for (uint256 i = 0; i < a.length; i++) assertEq(a[i], b[i]);
  }
}
