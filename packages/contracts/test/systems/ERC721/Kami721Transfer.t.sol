// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import "tests/utils/SetupTemplate.t.sol";

contract Kami721TransferTest is SetupTemplate {
  function testKami721TransferBatchToSingle() public {
    uint256[] memory kamiIDs = _mintKamis(alice, 10);
    uint256[] memory kamiIndices = new uint256[](kamiIDs.length);
    for (uint256 i = 0; i < kamiIDs.length; i++)
      kamiIndices[i] = LibKami.getIndex(components, kamiIDs[i]);
    _unstakeKami(kamiIDs);

    // approvals
    vm.prank(alice.owner);
    _Kami721.setApprovalForAll(address(_Kami721TransferSystem), true);
    vm.prank(bob.owner);
    _Kami721.setApprovalForAll(address(_Kami721TransferSystem), true);

    // transferring fully owned kamis
    vm.prank(alice.owner);
    _Kami721TransferSystem.batchTransferToSingle(kamiIndices, bob.owner);
    uint256[] memory bobKamis = kamiIDs;
    for (uint256 i = 0; i < kamiIndices.length; i++) {
      assertEq(_Kami721.ownerOf(kamiIndices[i]), bob.owner);
    }

    // transferring unowned kamis
    vm.prank(alice.owner);
    vm.expectRevert();
    _Kami721TransferSystem.batchTransferToSingle(kamiIndices, bob.owner);

    // transferring partially unowned kamis
    uint256[] memory aliceKamis = _mintKamis(alice, 5);
    _unstakeKami(aliceKamis);
    for (uint256 i = 0; i < aliceKamis.length; i++)
      kamiIndices[i] = LibKami.getIndex(components, aliceKamis[i]);
    vm.prank(alice.owner);
    vm.expectRevert();
    _Kami721TransferSystem.batchTransferToSingle(kamiIndices, bob.owner);
    for (uint256 i = 0; i < bobKamis.length; i++) {
      assertEq(_Kami721.ownerOf(LibKami.getIndex(components, bobKamis[i])), bob.owner);
    }
    for (uint256 i = 0; i < aliceKamis.length; i++) {
      assertEq(_Kami721.ownerOf(LibKami.getIndex(components, aliceKamis[i])), alice.owner);
    }

    // transferring fully unowned kamis
    vm.prank(alice.owner);
    vm.expectRevert();
    _Kami721TransferSystem.batchTransferToSingle(kamiIndices, bob.owner);
    for (uint256 i = 0; i < bobKamis.length; i++) {
      assertEq(_Kami721.ownerOf(LibKami.getIndex(components, bobKamis[i])), bob.owner);
    }
  }

  function testKami721TransferBatchToMultiple() public {
    uint256[] memory kamiIDs = _mintKamis(alice, 10);
    uint256[] memory kamiIndices = new uint256[](kamiIDs.length);
    for (uint256 i = 0; i < kamiIDs.length; i++)
      kamiIndices[i] = LibKami.getIndex(components, kamiIDs[i]);
    _unstakeKami(kamiIDs);
    address[] memory recipients = new address[](kamiIDs.length);
    for (uint256 i = 0; i < recipients.length; i++) recipients[i] = address(uint160(i + 1));

    // approvals
    vm.prank(alice.owner);
    _Kami721.setApprovalForAll(address(_Kami721TransferSystem), true);
    vm.prank(bob.owner);
    _Kami721.setApprovalForAll(address(_Kami721TransferSystem), true);

    // transferring fully owned kamis
    vm.prank(alice.owner);
    _Kami721TransferSystem.batchTransferToMultiple(kamiIndices, recipients);
    for (uint256 i = 0; i < kamiIDs.length; i++) {
      assertEq(_Kami721.ownerOf(kamiIndices[i]), recipients[i]);
    }

    // transferring partially owned kamis
    uint256[] memory aliceKamis = _mintKamis(alice, 5);
    _unstakeKami(aliceKamis);
    uint256[] memory aliceKamiIndices = new uint256[](aliceKamis.length);
    for (uint256 i = 0; i < aliceKamis.length; i++)
      aliceKamiIndices[i] = LibKami.getIndex(components, aliceKamis[i]);
    vm.prank(alice.owner);
    vm.expectRevert();
    _Kami721TransferSystem.batchTransferToMultiple(aliceKamiIndices, recipients);
    for (uint256 i = 0; i < kamiIDs.length; i++) {
      assertEq(_Kami721.ownerOf(kamiIndices[i]), recipients[i]);
    }
    for (uint256 i = 0; i < aliceKamis.length; i++) {
      assertEq(_Kami721.ownerOf(aliceKamiIndices[i]), alice.owner);
    }

    // transferring fully unowned kamis
    vm.prank(bob.owner);
    vm.expectRevert();
    _Kami721TransferSystem.batchTransferToMultiple(kamiIndices, recipients);
    for (uint256 i = 0; i < kamiIDs.length; i++) {
      assertEq(_Kami721.ownerOf(kamiIndices[i]), recipients[i]);
    }
  }
}
