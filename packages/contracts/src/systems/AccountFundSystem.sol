// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibScore } from "libraries/LibScore.sol";

uint256 constant ID = uint256(keccak256("system.Account.Fund"));

// hopper system to fund/refund burner wallet.
// using a system instead of directly sending eth to fit into MUD client flow.
contract AccountFundSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  // funds operator wallet with eth from owner
  // msg.sender is owner wallet
  function ownerToOperator() public payable returns (bytes memory) {
    uint256 accountID = LibAccount.getByOwner(components, msg.sender);
    require(accountID != 0, "AccountFundSystem: no account");

    // update gas funded
    LibScore.incBy(world, components, accountID, "OPERATOR_GAS", msg.value);

    address operator = LibAccount.getOperator(components, accountID);
    transfer(operator, msg.value);

    return "";
  }

  // refunds owner gas in operator
  // msg.sender is operator wallet
  function operatorToOwner() public payable returns (bytes memory) {
    uint256 accountID = LibAccount.getByOperator(components, msg.sender);
    require(accountID != 0, "AccountFundSystem: no account");

    // update gas funded
    LibScore.decBy(world, components, accountID, "OPERATOR_GAS", msg.value);

    address owner = LibAccount.getOwner(components, accountID);
    transfer(owner, msg.value);

    return "";
  }

  function transfer(address to, uint256 amount) internal {
    payable(to).transfer(amount);
  }

  function execute(bytes memory arguments) public returns (bytes memory) {
    require(false, "AccountFundSystem: not implemented");
    return "";
  }

  function executeTyped(uint256 to) public returns (bytes memory) {
    require(false, "AccountFundSystem: not implemented");
    return execute(abi.encode(to));
  }
}
