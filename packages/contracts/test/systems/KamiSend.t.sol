// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import "tests/utils/SetupTemplate.t.sol";
import { LibKami } from "libraries/LibKami.sol";
import { LibAccount } from "libraries/LibAccount.sol";
import { LibCooldown } from "libraries/utils/LibCooldown.sol";
/// @notice Tests for KamiSendSystem — in-world kami transfers
contract KamiSendTest is SetupTemplate {
  function setUp() public override {
    super.setUp();
    vm.roll(_currBlock++);

    vm.startPrank(deployer);
    __KamiMarketRegistrySystem.setEnabled(true);
    __KamiMarketRegistrySystem.setPurchaseCooldown(3600);
    vm.stopPrank();
  }

  /////////////////
  // HELPERS

  function _createStakedKami(PlayerAccount memory acc) internal returns (uint256 kamiID, uint32 kamiIndex) {
    kamiID = _mintKami(acc);
    kamiIndex = LibKami.getIndex(components, kamiID);
    assertTrue(LibKami.isState(components, kamiID, "RESTING"));
    assertEq(LibKami.getAccount(components, kamiID), acc.id);
  }

  function _sendKami(PlayerAccount memory acc, uint32 kamiIndex, address toAddress) internal {
    vm.prank(acc.operator);
    _KamiSendSystem.executeTyped(kamiIndex, toAddress);
  }

  function _sendKamiBatch(PlayerAccount memory acc, uint32[] memory kamiIndices, address toAddress) internal {
    vm.prank(acc.operator);
    _KamiSendSystem.executeTyped(kamiIndices, toAddress);
  }

  function _listKami(
    PlayerAccount memory acc,
    uint32 kamiIndex,
    uint256 price
  ) internal returns (uint256 orderID) {
    vm.startPrank(acc.operator);
    orderID = abi.decode(_KamiMarketListSystem.executeTyped(kamiIndex, price, 0), (uint256));
    vm.stopPrank();
  }

  /////////////////
  // SUCCESS TESTS

  function testSendRestingKami() public {
    (uint256 kamiID, uint32 kamiIndex) = _createStakedKami(alice);

    _sendKami(alice, kamiIndex, bob.operator);

    // Verify kami transferred to bob
    assertEq(LibKami.getAccount(components, kamiID), bob.id);
    assertEq(LibKami.getState(components, kamiID), "RESTING");
  }

  function testSendListedKami() public {
    (uint256 kamiID, uint32 kamiIndex) = _createStakedKami(alice);

    // List the kami
    uint256 orderID = _listKami(alice, kamiIndex, 1 ether);
    assertEq(LibKami.getState(components, kamiID), "LISTED");

    // Send should auto-cancel listing
    _sendKami(alice, kamiIndex, bob.operator);

    // Verify kami transferred to bob and is RESTING
    assertEq(LibKami.getAccount(components, kamiID), bob.id);
    assertEq(LibKami.getState(components, kamiID), "RESTING");

    // Verify listing was cancelled
    assertEq(_StateComponent.get(orderID), "CANCELLED");
  }

  function testBatchSend() public {
    (uint256 kamiID1, uint32 kamiIndex1) = _createStakedKami(alice);
    (uint256 kamiID2, uint32 kamiIndex2) = _createStakedKami(alice);

    uint32[] memory indices = new uint32[](2);
    indices[0] = kamiIndex1;
    indices[1] = kamiIndex2;

    _sendKamiBatch(alice, indices, bob.operator);

    // Both kamis now owned by bob
    assertEq(LibKami.getAccount(components, kamiID1), bob.id);
    assertEq(LibKami.getAccount(components, kamiID2), bob.id);
    assertEq(LibKami.getState(components, kamiID1), "RESTING");
    assertEq(LibKami.getState(components, kamiID2), "RESTING");
  }

  function testSendAppliesCooldown() public {
    (uint256 kamiID, uint32 kamiIndex) = _createStakedKami(alice);

    _sendKami(alice, kamiIndex, bob.operator);

    // Verify purchase cooldown is active
    assertTrue(LibCooldown.isActive(components, kamiID));
  }

  /////////////////
  // REVERT TESTS

  function testRevertSelfSend() public {
    (, uint32 kamiIndex) = _createStakedKami(alice);

    vm.prank(alice.operator);
    vm.expectRevert("KamiSend: cannot send to self");
    _KamiSendSystem.executeTyped(kamiIndex, alice.operator);
  }

  function testRevertNotOwned() public {
    (, uint32 kamiIndex) = _createStakedKami(alice);

    // Bob tries to send alice's kami
    vm.prank(bob.operator);
    vm.expectRevert(); // verifyKamiOwnedRestingOrListed will fail
    _KamiSendSystem.executeTyped(kamiIndex, charlie.operator);
  }

  function testRevertNotRestingOrListed() public {
    (uint256 kamiID, uint32 kamiIndex) = _createStakedKami(alice);

    // Put kami in HARVESTING state
    vm.prank(deployer);
    _StateComponent.set(kamiID, string("HARVESTING"));

    vm.prank(alice.operator);
    vm.expectRevert("KamiMarket: kami not available");
    _KamiSendSystem.executeTyped(kamiIndex, bob.operator);
  }

  function testSendSoulboundKami() public {
    (uint256 kamiID, uint32 kamiIndex) = _createStakedKami(alice);

    // Make kami soulbound — send should still work (no soulbound check, matching marketplace buy)
    uint256 soulboundEntity = uint256(keccak256(abi.encode(kamiID, "SOULBOUND")));
    vm.prank(deployer);
    _ValueComponent.set(soulboundEntity, block.timestamp + 3 days);

    _sendKami(alice, kamiIndex, bob.operator);

    assertEq(LibKami.getAccount(components, kamiID), bob.id);
    assertEq(LibKami.getState(components, kamiID), "RESTING");
  }

  function testRevertTargetNoAccount() public {
    (, uint32 kamiIndex) = _createStakedKami(alice);

    // Send to address with no account
    address noAccount = address(0xdead);
    vm.prank(alice.operator);
    vm.expectRevert("Account: Operator not found");
    _KamiSendSystem.executeTyped(kamiIndex, noAccount);
  }

  function testRevertEmptyBatch() public {
    uint32[] memory indices = new uint32[](0);

    vm.prank(alice.operator);
    vm.expectRevert("KamiSend: empty batch");
    _KamiSendSystem.executeTyped(indices, bob.operator);
  }

  function testKamiStateIsRestingAfterSend() public {
    (uint256 kamiID, uint32 kamiIndex) = _createStakedKami(alice);

    // List first, then send
    _listKami(alice, kamiIndex, 1 ether);
    assertEq(LibKami.getState(components, kamiID), "LISTED");

    _sendKami(alice, kamiIndex, bob.operator);

    // Verify final state is RESTING
    assertEq(LibKami.getState(components, kamiID), "RESTING");
  }
}
