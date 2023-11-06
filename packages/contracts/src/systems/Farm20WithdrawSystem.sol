// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";
import { ControlledBridgeSystem } from "utils/ControlledBridgeSystem.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibCoin } from "libraries/LibCoin.sol";
import { LibDataEntity } from "libraries/LibDataEntity.sol";
import { LibTimelock } from "libraries/LibTimelock.sol";

import { Farm20 } from "tokens/Farm20.sol";
import { Farm20ProxySystem, ID as ProxyID } from "systems/Farm20ProxySystem.sol";

uint256 constant ID = uint256(keccak256("system.Farm20.Withdraw"));
uint256 constant ROOM = 12;

/// @notice Farm20 game world => outside (ERC20)
/** @dev
 * Room 12 is the bridge room, system can only be called there
 * Mints Farm20 tokens to recieving address, reduces CoinComponent balance
 * to be called by account owner
 */
contract Farm20WithdrawSystem is ControlledBridgeSystem {
  uint8 public constant ADMIN_ROLE = 1;

  constructor(
    IWorld _world,
    address _components
  ) System(_world, _components) ControlledBridgeSystem(1 days) {}

  /// @notice starts the withdraw process. required to wait min delay
  function scheduleWithdraw(uint256 value) public returns (uint256 id) {
    require(value > 0, "Farm20Withdraw: amt must be > 0");

    uint256 accountID = LibAccount.getByOwner(components, msg.sender);
    require(accountID != 0, "Farm20Withdraw: no account");
    require(LibAccount.getRoom(components, accountID) == ROOM, "Farm20Withdraw: not in room 12");
    require(LibCoin.get(components, accountID) >= value, "Coin: insufficient balance");

    // scheduling timelock
    _schedule(msg.sender, value, block.timestamp);
    id = LibTimelock.create(world, components, accountID, msg.sender, value, block.timestamp);

    // standard logging and tracking
    LibAccount.updateLastTs(components, accountID);
  }

  /// @notice executes the withdraw process
  function executeWithdraw(uint256 id) public {
    (address target, uint256 value, uint256 salt) = LibTimelock.getTimelock(components, id);

    // check and set timelock operation
    _execute(target, value, salt);
    LibTimelock.unset(components, id);

    // withdraw balance
    uint256 accountID = LibAccount.getByOwner(components, target);
    LibCoin.dec(components, accountID, value);
    Farm20 token = Farm20ProxySystem(getAddressById(world.systems(), ProxyID)).getToken();
    token.withdraw((target), value);

    // standard logging and tracking
    LibDataEntity.inc(components, accountID, 0, "COIN_WITHDRAW", value);
    LibAccount.updateLastTs(components, accountID);
  }

  /// @notice cancels a transaction, either by Admin (if tx is suspicious) or by user
  function cancelWithdraw(uint256 id) public {
    (address target, uint256 value, uint256 salt) = LibTimelock.getTimelock(components, id);
    require(isAdmin(msg.sender) || target == msg.sender, "not authorized");

    // cancel timelock operation
    _cancel(hashOperation(target, value, salt));
    LibTimelock.unset(components, id);
  }

  function execute(bytes memory arguments) public returns (bytes memory) {
    require(false, "unimplemented");
    return "";
  }
}
