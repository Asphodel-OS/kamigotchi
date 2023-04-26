// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "test/utils/SetupTemplate.s.sol";

// manually imports and deploys erc20.
// TODO: integrate it with deployment script
import { RandomDKG, REVEAL_GRACE_PERIOD, EPOCH_LENGTH, PLEDGE_VALUE } from "utils/RandomDKG.sol";
import { ID as MintSystemID } from "systems/ERC721MintSystem.sol";

contract ERC20Test is SetupTemplate {
  RandomDKG _dkg;
  uint256 START_TIME;

  function setUp() public override {
    super.setUp();
    START_TIME = block.timestamp;
    _dkg = _RandomDKGProxySystem.getContract();
  }

  function testPledge() public {
    uint256 expPledge = 987;

    // expect EPOCH = 0
    vm.warp(START_TIME + REVEAL_GRACE_PERIOD + 1);
    assertEq(_dkg.getCurrEpoch(), 0);
    assertEq(_dkg.getCurrPledgeEpoch(), 0);

    // pledge at epoch 0
    address pledger = address(123);
    vm.deal(pledger, PLEDGE_VALUE + 1);
    vm.startPrank(pledger);

    // fail pledge, under value tx
    vm.expectRevert("wrong pledge amount");
    _dkg.contributePledgeHash{ value: PLEDGE_VALUE - 1 }(keccak256(abi.encodePacked(expPledge)));

    // correct pledge
    _dkg.contributePledgeHash{ value: PLEDGE_VALUE }(keccak256(abi.encodePacked(expPledge)));
    assertEq(pledger.balance, 1);

    // change time, reveal pledge, assert refund
    vm.warp(START_TIME + EPOCH_LENGTH + REVEAL_GRACE_PERIOD - 10);
    assertEq(_dkg.getCurrEpoch(), 1);
    assertEq(_dkg.getCurrPledgeEpoch(), 0);
    _dkg.revealPledge(bytes32(expPledge));
    assertEq(pledger.balance, PLEDGE_VALUE + 1);
  }
}
