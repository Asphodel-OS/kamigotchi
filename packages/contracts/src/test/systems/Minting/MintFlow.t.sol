// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "test/utils/SetupTemplate.s.sol";

/** @dev
 * this focus on minting flow, specifically
 * - buying $MINT20 with ETH
 * - getting kamis from gacha via $MINT20
 * - ETH based rerolling costs
 */
contract MintFlowTest is SetupTemplate {
  function testCreateRoom() public {
    // uint256[] memory exits = new uint256[](1);
    // exits[0] = 1;
    // _createRoom("test", 1, 1, 0, 0);
  }
}
