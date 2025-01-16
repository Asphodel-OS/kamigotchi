// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import "./BaseTester.t.sol";

import { LibQuery, QueryFragment, QueryType } from "../LibQuery.sol";
import { TestComponent1, TestComponent2, TestComponent3 } from "./components/TestComponent.sol";
import { PrototypeTagComponent } from "./components/PrototypeTagComponent.sol";
import { FromPrototypeComponent } from "./components/FromPrototypeComponent.sol";
import { OwnedByEntityComponent } from "./components/OwnedByEntityComponent.sol";

contract LibQueryTest is BaseTester {
  address payable[] internal users;

  TestComponent1 internal component1;
  TestComponent2 internal component2;
  TestComponent3 internal component3;

  PrototypeTagComponent internal prototypeTag;
  FromPrototypeComponent internal fromPrototype;
  OwnedByEntityComponent internal ownedByEntity;

  function setUp() public override {
    super.setUp();

    component1 = new TestComponent1(address(world));
    world.registerComponent(address(component1), component1.ID());
    component2 = new TestComponent2(address(world));
    world.registerComponent(address(component2), component2.ID());
    component3 = new TestComponent3(address(world));
    world.registerComponent(address(component3), component3.ID());
    prototypeTag = new PrototypeTagComponent(address(world));
    world.registerComponent(address(prototypeTag), prototypeTag.ID());
    fromPrototype = new FromPrototypeComponent(address(world));
    world.registerComponent(address(fromPrototype), fromPrototype.ID());
    ownedByEntity = new OwnedByEntityComponent(address(world));
    world.registerComponent(address(ownedByEntity), ownedByEntity.ID());
  }

  ///////////////////////
  // QUERY TESTS

  function testInvalidQuery() public {
    component1.set(1, abi.encode(1));
    component1.set(2, abi.encode(1));
    component2.set(1, abi.encode(10));
    // Query should return all entities that have component1
    QueryFragment[] memory fragments = new QueryFragment[](1);
    // The value argument is ignored in for Has query fragments
    fragments[0] = QueryFragment(QueryType.Has, component1, new bytes(0));

    vm.expectRevert(LibQuery.QueryOrderNotSupported.selector);
    uint256[] memory entities = LibQuery.query(fragments);

    fragments[0] = QueryFragment(QueryType.Not, component1, new bytes(0));
    vm.expectRevert(LibQuery.QueryOrderNotSupported.selector);
    entities = LibQuery.query(fragments);

    fragments[0] = QueryFragment(QueryType.NotValue, component1, abi.encode(1));
    vm.expectRevert(LibQuery.QueryOrderNotSupported.selector);
    entities = LibQuery.query(fragments);
  }

  function testHasValueQuery() public {
    component1.set(1, abi.encode(2));
    component1.set(2, abi.encode(1));
    component1.set(3, abi.encode(1));
    // Query should return all entities that have component1 with value 1
    QueryFragment[] memory fragments = new QueryFragment[](1);
    fragments[0] = QueryFragment(QueryType.HasValue, component1, abi.encode(1));
    uint256[] memory entities = LibQuery.query(fragments);

    assertTrue(entities.length == 2);
    assertTrue(entities[0] == 2);
    assertTrue(entities[1] == 3);
  }

  function testCombinedHasValueQuery() public {
    component1.set(1, abi.encode(2));
    component1.set(2, abi.encode(2));
    component1.set(3, abi.encode(1));
    component2.set(2, abi.encode(1));
    component2.set(3, abi.encode(1));
    component3.set(1, abi.encode(1));

    // Query should return all entities that have component1 and component2
    QueryFragment[] memory fragments = new QueryFragment[](2);
    fragments[0] = QueryFragment(QueryType.HasValue, component1, abi.encode(1));
    fragments[1] = QueryFragment(QueryType.HasValue, component2, abi.encode(1));
    uint256[] memory entities = LibQuery.query(fragments);

    assertTrue(entities.length == 1);
    assertTrue(entities[0] == 3);
  }

  function testCombinedHasValueHasQuery() public {
    component1.set(1, abi.encode(1));
    component1.set(2, abi.encode(1));
    component1.set(3, abi.encode(1));
    component2.set(1, abi.encode(1));
    component2.set(2, abi.encode(2));
    component2.set(3, abi.encode(2));
    component2.set(4, abi.encode(2));

    // Query should return all entities that have component1 and component2
    QueryFragment[] memory fragments = new QueryFragment[](2);
    fragments[0] = QueryFragment(QueryType.HasValue, component2, abi.encode(2));
    fragments[1] = QueryFragment(QueryType.Has, component1, new bytes(0));
    uint256[] memory entities = LibQuery.query(fragments);

    assertTrue(entities.length == 2);
    assertTrue(entities[0] == 2);
    assertTrue(entities[1] == 3);
  }

  function testCombinedHasValueNotQuery() public {
    component1.set(1, abi.encode(1));
    component1.set(2, abi.encode(1));
    component1.set(3, abi.encode(1));
    component2.set(1, abi.encode(1));
    component2.set(2, abi.encode(2));
    component2.set(3, abi.encode(1));
    component2.set(4, abi.encode(1));

    // Query should return all entities that have component2 and not component1
    QueryFragment[] memory fragments = new QueryFragment[](2);
    fragments[0] = QueryFragment(QueryType.HasValue, component2, abi.encode(1));
    fragments[1] = QueryFragment(QueryType.Not, component1, new bytes(0));
    uint256[] memory entities = LibQuery.query(fragments);

    assertTrue(entities.length == 1);
    assertTrue(entities[0] == 4);
  }

  function testCombinedHasValueNotHasQuery() public {
    component1.set(1, abi.encode(1));
    component1.set(2, abi.encode(1));
    component1.set(3, abi.encode(1));
    component2.set(1, abi.encode(1));
    component2.set(2, abi.encode(2));
    component2.set(3, abi.encode(1));
    component2.set(4, abi.encode(1));
    component3.set(2, abi.encode(1));
    component3.set(3, abi.encode(1));
    component3.set(4, abi.encode(1));

    // Query should return all entities that have component2 and not component1
    QueryFragment[] memory fragments = new QueryFragment[](3);
    fragments[0] = QueryFragment(QueryType.HasValue, component2, abi.encode(1));
    fragments[1] = QueryFragment(QueryType.Not, component3, new bytes(0));
    fragments[2] = QueryFragment(QueryType.Has, component1, new bytes(0));
    uint256[] memory entities = LibQuery.query(fragments);

    assertTrue(entities.length == 1);
    assertTrue(entities[0] == 1);
  }

  ///////////////////////
  // UTILS TESTS

  function testRemoveZeros() public {
    // test basic
    uint256[] memory arr = new uint256[](5);
    arr[0] = 0;
    arr[1] = 1;
    arr[2] = 0;
    arr[3] = 1;
    arr[4] = 0;

    uint256[] memory result = LibQuery.removeZeros(arr, 2);
    assertEq(result.length, 2);
    assertEq(result[0], 1);
    assertEq(result[1], 1);

    // test basic again
    arr[0] = 1;
    arr[1] = 0;
    arr[2] = 0;
    arr[3] = 0;
    arr[4] = 1;

    result = LibQuery.removeZeros(arr, 2);
    assertEq(result.length, 2);
    assertEq(result[0], 1);
    assertEq(result[1], 1);

    // test no zeros
    arr[0] = 1;
    arr[1] = 1;
    arr[2] = 1;
    arr[3] = 1;
    arr[4] = 1;

    result = LibQuery.removeZeros(arr, 5);
    assertEq(result.length, 5);
    assertEq(result[0], 1);
    assertEq(result[1], 1);
    assertEq(result[2], 1);
    assertEq(result[3], 1);
    assertEq(result[4], 1);

    // test all zeros
    arr[0] = 0;
    arr[1] = 0;
    arr[2] = 0;
    arr[3] = 0;
    arr[4] = 0;

    result = LibQuery.removeZeros(arr, 0);
    assertEq(result.length, 0);

    // test empty
    arr = new uint256[](0);

    result = LibQuery.removeZeros(arr, 0);
    assertEq(result.length, 0);

    // test basic shorter
    arr = new uint256[](2);
    arr[0] = 0;
    arr[1] = 1;

    result = LibQuery.removeZeros(arr, 1);
    assertEq(result.length, 1);
    assertEq(result[0], 1);
  }

  function testRemoveZerosFuzz(uint) public {
    uint256[] memory arr = _randomUints(_randomArrayLength());

    uint256 numZeros;
    for (uint256 i; i < arr.length; ++i) if (arr[i] == 0) ++numZeros;

    uint256[] memory result = LibQuery.removeZeros(arr, arr.length - numZeros);
    assertEq(result.length, arr.length - numZeros);
    for (uint256 i; i < result.length; ++i) assertTrue(result[i] != 0);
  }

  ////////////////////
  // UTILS

  function _randomUints(uint256 n) private returns (uint256[] memory a) {
    unchecked {
      _misalignFreeMemoryPointer();
      /// @solidity memory-safe-assembly
      assembly {
        a := mload(0x40)
        mstore(a, n)
        mstore(0x40, add(add(0x20, a), shl(5, n)))
      }
      for (uint256 i; i != n; ++i) {
        a[i] = _random();
      }
    }
  }

  function _randomArrayLength() internal returns (uint256 r) {
    r = _random();
    /// @solidity memory-safe-assembly
    assembly {
      let m := 0x070707070707070707070707070707070f0f0f0f0f0f0f1f1f1f1f1f1f3f7fff
      r := and(byte(1, r), byte(and(r, 31), m))
    }
  }

  /// @dev Misaligns the free memory pointer.
  /// The free memory pointer has a 1/32 chance to be aligned.
  function _misalignFreeMemoryPointer() internal pure {
    uint256 twoWords = 0x40;
    /// @solidity memory-safe-assembly
    assembly {
      let m := mload(twoWords)
      m := add(m, mul(and(keccak256(0x00, twoWords), 0x1f), iszero(and(m, 0x1f))))
      mstore(twoWords, m)
    }
  }

  /// @dev Returns a pseudorandom random number from [0 .. 2**256 - 1] (inclusive).
  /// For usage in fuzz tests, please ensure that the function has an unnamed uint256 argument.
  /// e.g. `testSomething(uint256) public`.
  function _random() internal returns (uint256 r) {
    /// @solidity memory-safe-assembly
    assembly {
      // This is the keccak256 of a very long string I randomly mashed on my keyboard.
      let sSlot := 0xd715531fe383f818c5f158c342925dcf01b954d24678ada4d07c36af0f20e1ee
      let sValue := sload(sSlot)

      mstore(0x20, sValue)
      r := keccak256(0x20, 0x40)

      // If the storage is uninitialized, initialize it to the keccak256 of the calldata.
      if iszero(sValue) {
        sValue := sSlot
        let m := mload(0x40)
        calldatacopy(m, 0, calldatasize())
        r := keccak256(m, calldatasize())
      }
      sstore(sSlot, add(r, 1))

      // Do some biased sampling for more robust tests.
      // prettier-ignore
      for {} 1 {} {
        let d := byte(0, r)
        // With a 1/256 chance, randomly set `r` to any of 0,1,2.
        if iszero(d) {
            r := and(r, 3)
            break
        }
        // With a 1/2 chance, set `r` to near a random power of 2.
        if iszero(and(2, d)) {
            // Set `t` either `not(0)` or `xor(sValue, r)`.
            let t := xor(not(0), mul(iszero(and(4, d)), not(xor(sValue, r))))
            // Set `r` to `t` shifted left or right by a random multiple of 8.
            switch and(8, d)
            case 0 {
                if iszero(and(16, d)) { t := 1 }
                r := add(shl(shl(3, and(byte(3, r), 0x1f)), t), sub(and(r, 7), 3))
            }
            default {
                if iszero(and(16, d)) { t := shl(255, 1) }
                r := add(shr(shl(3, and(byte(3, r), 0x1f)), t), sub(and(r, 7), 3))
            }
            // With a 1/2 chance, negate `r`.
            if iszero(and(0x20, d)) { r := not(r) }
            break
        }
        // Otherwise, just set `r` to `xor(sValue, r)`.
        r := xor(sValue, r)
        break
    }
    }
  }
}
