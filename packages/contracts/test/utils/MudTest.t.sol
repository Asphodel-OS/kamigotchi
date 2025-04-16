// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import { Test, console } from "forge-std/Test.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { IUint256Component } from "solecs/interfaces/IUint256Component.sol";
import { getAddrByID } from "solecs/utils.sol";
import { LibDeploy } from "deployment/LibDeploy.sol";

string constant mnemonic = "test test test test test test test test test test test junk";

contract MudTest is Test {
  address internal deployer;
  uint32 internal addressCounter;

  IWorld internal world;
  IUint256Component components;
  IUint256Component systems;

  constructor() {
    (deployer, ) = deriveRememberKey(mnemonic, 0);
  }

  function setUp() public virtual {
    vm.startPrank(deployer);
    world = LibDeploy.deploy(address(0), deployer, false, true);
    vm.stopPrank();

    components = world.components();
    systems = world.systems();

    // registering sender as system for getUniqueEntityId()
    vm.startPrank(address(world));
    systems.set(uint256(uint160((address(this)))), 0);
    systems.set(uint256(uint160((address(deployer)))), 0);
    vm.stopPrank();
  }

  /////////////////
  // UTILS

  function _getNextUserAddress() internal returns (address) {
    addressCounter++;
    (address addr, ) = deriveRememberKey(mnemonic, addressCounter);
    return payable(addr);
  }

  function component(uint256 id) public view returns (address) {
    return getAddrByID(components, id);
  }

  function system(uint256 id) public view returns (address) {
    return getAddrByID(systems, id);
  }

  function getWorldNonce() public view returns (uint256) {
    // world nonce is private, in first slot
    return uint256(vm.load(address(world), bytes32(uint256(0))));
  }

  function simGetUniqueEntityId() public view returns (uint256) {
    return simGetUniqueEntityId(getWorldNonce() + 1);
  }

  function simGetUniqueEntityId(uint256 nonce) public view returns (uint256) {
    return uint256(keccak256(abi.encodePacked(nonce)));
  }

  function _assumeNoOverflowAdd(uint256 a, uint256 b) internal {
    uint256 result;
    unchecked {
      result = a + b;
    }
    vm.assume(result >= a + b);
  }

  function _assumeNoOverflowMul(uint256 a, uint256 b) internal {
    uint256 result;
    unchecked {
      result = a * b;
    }
    vm.assume(result / a == b);
  }

  function _randomUints(uint256 n) internal returns (uint256[] memory a) {
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
