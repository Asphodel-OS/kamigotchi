// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";

uint256 constant ID = uint256(keccak256("system.account.termsAndConditions"));

contract AccountAcceptTCSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    // does not check for account existence, accept based on owner address
    uint256 accID = uint256(uint160(msg.sender));
    LibAccount.setAcceptedTerms(components, accID);

    return abi.encode(accID);
  }

  function executeTyped() public returns (bytes memory) {
    return execute(new bytes(0));
  }
}
