// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import { DSTestPlus } from "solmate/test/utils/DSTestPlus.sol";
import { Vm } from "forge-std/Vm.sol";
import { console } from "forge-std/console.sol";

import { World } from "solecs/World.sol";
import { Stat, StatLib } from "solecs/components/types/Stat.sol";
import { StatComponent } from "solecs/components/StatComponent.sol";

contract StatCompTest is DSTestPlus {
  Vm internal immutable vm = Vm(HEVM_ADDRESS);

  address deployer = address(1);
  StatComponent statComp;

  function setUp() public {
    vm.startPrank(deployer);
    World world = new World();
    world.init();
    statComp = new StatComponent(address(world), uint256(keccak256("test.Stat")));
    vm.stopPrank();
  }

  //////////////
  // COMPONENT

  function testStatComponent() public {
    uint256 id = 111;
    uint256[] memory ids = new uint256[](1);
    ids[0] = id;
    Stat memory original = Stat(1, 2, 3, 4);
    Stat[] memory ogBatch = new Stat[](1);
    ogBatch[0] = original;

    vm.prank(deployer);
    statComp.set(id, original);

    // test getting
    assertEq(statComp.get(id), original);
    vm.expectRevert();
    statComp.get(1);
    assertEq(statComp.get(ids), ogBatch);

    // test extract
    vm.prank(deployer);
    Stat memory extracted = statComp.extract(id);
    assertEq(extracted, original);
    assertTrue(!statComp.has(id));
    vm.expectRevert();
    statComp.get(id);
    vm.prank(deployer);
    statComp.set(id, original);
    vm.prank(deployer);
    assertEq(statComp.extract(ids), ogBatch);
    assertEq(extracted, original);
    assertTrue(!statComp.has(id));
    vm.expectRevert();
    statComp.get(id);

    // test setting
    vm.prank(deployer);
    statComp.set(id, original);
    assertEq(statComp.get(id), original);
    ids = new uint256[](3);
    ids[0] = 1000;
    ids[1] = 1001;
    ids[2] = 1002;
    ogBatch = new Stat[](3);
    ogBatch[0] = Stat(10, 20, 30, 40);
    ogBatch[1] = Stat(11, 21, 31, 41);
    ogBatch[2] = Stat(12, 22, 32, 42);
    vm.prank(deployer);
    statComp.set(ids, ogBatch);
    for (uint256 i = 0; i < ids.length; i++) {
      assertEq(statComp.get(ids[i]), ogBatch[i]);
    }
    assertEq(statComp.get(ids), ogBatch);

    // test setting permissions
    vm.expectRevert();
    statComp.set(0, Stat(1, 1, 1, 1));
    Stat[] memory batch = new Stat[](2);
    batch[0] = Stat(1, 1, 1, 1);
    batch[1] = Stat(2, 2, 2, 2);
    vm.expectRevert();
    statComp.set(ids, batch);

    // test removing permissions
    vm.expectRevert();
    statComp.remove(id);
    vm.expectRevert();
    statComp.remove(ids);

    // test extract permissions
    vm.expectRevert();
    statComp.extract(id);
    vm.expectRevert();
    statComp.extract(ids);
  }

  function testStatCompFunctions() public {
    uint256 id = 111;
    Stat memory stat = Stat(1, 2, 3, 4);
    vm.prank(deployer);
    statComp.set(id, stat);

    // test total
    int32 expTotal = ((1e3 + stat.boost) * (stat.base + stat.shift)) / 1e3;
    assertEq(statComp.calcTotal(id), expTotal);

    // test sync, 0 amt
    stat = Stat(10, 0, 0, 5);
    vm.prank(deployer);
    statComp.set(id, stat);
    vm.prank(deployer);
    int32 synced = statComp.sync(id, 0);
    assertEq(synced, 5, "sync 0 mismatch");
    assertEq(statComp.get(id).sync, 5);

    // test sync, positive amt
    vm.prank(deployer);
    statComp.set(id, stat);
    vm.prank(deployer);
    synced = statComp.sync(id, 11);
    assertEq(synced, 10, "sync pos mismatch");
    assertEq(statComp.get(id).sync, 10);

    // test sync, negative amt
    vm.prank(deployer);
    statComp.set(id, stat);
    vm.prank(deployer);
    synced = statComp.sync(id, -1);
    assertEq(synced, 4, "sync neg mismatch");
    assertEq(statComp.get(id).sync, 4);

    // test sync, forced total
    vm.prank(deployer);
    statComp.set(id, stat);
    vm.prank(deployer);
    synced = statComp.sync(id, 100, 20);
    assertEq(synced, 20, "sync total mismatch");
    assertEq(statComp.get(id).sync, 20);

    // // test shift
    vm.prank(deployer);
    statComp.set(id, stat);
    stat.shift += 11;
    vm.prank(deployer);
    int32 shifted = statComp.shift(id, 11);
    assertEq(shifted, stat.shift, "shift mismatch");
    assertEq(statComp.get(id), stat);
    vm.expectRevert();
    statComp.shift(id, 1);

    // test boost
    vm.prank(deployer);
    statComp.set(id, stat);
    stat.boost += 2;
    vm.prank(deployer);
    int32 boosted = statComp.boost(id, 2);
    assertEq(boosted, stat.boost, "boost mismatch");
    assertEq(statComp.get(id), stat);
    vm.expectRevert();
    statComp.boost(id, 1);
  }

  //////////////
  // ENCODING

  function testStatLib(int32 base, int32 shift, int32 boost, int32 sync) public {
    Stat memory original = Stat(base, shift, boost, sync);

    // test uint256 conversion
    uint256 converted = StatLib.toUint(original);
    assertEq(StatLib.toStat(converted), original);

    // test abi encoding
    bytes memory encoded = StatLib.encode(original);
    assertEq(StatLib.decode(encoded), original);
  }

  function testStatLibBatch() public {
    // 0 case
    Stat[] memory stats = new Stat[](0);
    assertEq(StatLib.decodeBatch(StatLib.encodeBatch(stats)), stats);

    // 1 case
    stats = new Stat[](1);
    stats[0] = Stat(1, 2, 3, 4);
    assertEq(StatLib.decodeBatch(StatLib.encodeBatch(stats)), stats);

    // regular case
    stats = new Stat[](5);
    stats[0] = Stat(1, 2, 3, 4);
    stats[1] = Stat(5, 6, 7, 8);
    stats[2] = Stat(9, 10, 11, 12);
    stats[3] = Stat(13, 14, 15, 16);
    stats[4] = Stat(17, 18, 19, 20);
    Stat[] memory decoded = StatLib.decodeBatch(StatLib.encodeBatch(stats));
    assertEq(decoded[0], stats[0]);
    assertEq(decoded[1], stats[1]);
    assertEq(decoded[2], stats[2]);
    assertEq(decoded[3], stats[3]);
    assertEq(decoded[4], stats[4]);
  }

  //////////////
  // UTILS
  function assertEq(Stat memory a, Stat memory b) internal {
    assertEq(a.base, b.base);
    assertEq(a.shift, b.shift);
    assertEq(a.boost, b.boost);
    assertEq(a.sync, b.sync);
  }

  function assertEq(Stat[] memory a, Stat[] memory b) internal {
    assertEq(a.length, b.length);
    for (uint256 i = 0; i < a.length; i++) assertEq(a[i], b[i]);
  }
}
