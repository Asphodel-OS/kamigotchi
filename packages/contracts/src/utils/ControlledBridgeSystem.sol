// SPDX-License-Identifier: AGPL-3.0-only
// OpenZeppelin Contracts (last updated v5.0.0) (governance/TimelockController.sol)

pragma solidity >=0.8.28;

import { RolesAuthority } from "solmate/auth/authorities/RolesAuthority.sol";
import { System } from "solecs/System.sol";

/**
 * @dev a controlled bridge that implements timelock and blacklisting logic
 *
 * The Timelock contract heavily based off of OpenZeppelin's TimelockController.sol
 * Removed various roles, predecessor checks, calldata
 *
 * owner permission is based on solady's ownable, from System. Admin roles are manually implemented
 */
abstract contract ControlledBridgeSystem is System {
  uint256 internal constant _DONE_TIMESTAMP = uint256(1);

  mapping(address => bool) private _adminRoles;
  mapping(address => bool) private _blacklist;
  mapping(bytes32 => uint256) private _timestamps;
  uint256 private _minDelay;

  enum OperationState {
    Unset,
    Waiting,
    Ready,
    Done
  }

  /// @dev emit when operation is scheduled
  event CallScheduled(bytes32 indexed id, address indexed target, uint256 value, uint256 timestamp);

  /// @dev emit when operation is executed
  event CallExecuted(bytes32 indexed id, address indexed target, uint256 value);

  /// @dev emit when operation is cancelled
  event CallCancelled(bytes32 indexed id);

  modifier onlyAdmin() {
    require(_adminRoles[msg.sender] || owner() == msg.sender, "unauthorized");
    _;
  }

  modifier notBlacklisted(address target) {
    require(!_blacklist[target], "address blacklisted");
    _;
  }

  constructor(uint256 minDelay) {
    _minDelay = minDelay;
  }

  function isAdmin(address target) public view returns (bool) {
    return _adminRoles[target] || owner() == target;
  }

  /**
   * @dev Returns whether an id corresponds to a registered operation. This
   * includes both Waiting, Ready, and Done operations.
   */
  function isOperation(bytes32 id) public view returns (bool) {
    return getOperationState(id) != OperationState.Unset;
  }

  /**
   * @dev Returns whether an operation is pending or not. Note that a "pending" operation may also be "ready".
   */
  function isOperationPending(bytes32 id) public view returns (bool) {
    OperationState state = getOperationState(id);
    return state == OperationState.Waiting || state == OperationState.Ready;
  }

  /**
   * @dev Returns whether an operation is ready for execution. Note that a "ready" operation is also "pending".
   */
  function isOperationReady(bytes32 id) public view returns (bool) {
    return getOperationState(id) == OperationState.Ready;
  }

  /**
   * @dev Returns whether an operation is done or not.
   */
  function isOperationDone(bytes32 id) public view returns (bool) {
    return getOperationState(id) == OperationState.Done;
  }

  /**
   * @dev Returns whether an address is blacklisted or not.
   */
  function isBlacklisted(address target) public view returns (bool) {
    return _blacklist[target];
  }

  /**
   * @dev Returns the timestamp at which an operation becomes ready (0 for
   * unset operations, 1 for done operations).
   */
  function getTimestamp(bytes32 id) public view virtual returns (uint256) {
    return _timestamps[id];
  }

  /**
   * @dev Returns operation state.
   */
  function getOperationState(bytes32 id) public view virtual returns (OperationState) {
    uint256 timestamp = getTimestamp(id);
    if (timestamp == 0) {
      return OperationState.Unset;
    } else if (timestamp == _DONE_TIMESTAMP) {
      return OperationState.Done;
    } else if (timestamp > block.timestamp) {
      return OperationState.Waiting;
    } else {
      return OperationState.Ready;
    }
  }

  /// @dev Returns the minimum delay in seconds for an operation to become valid.
  function getMinDelay() public view virtual returns (uint256) {
    return _minDelay;
  }

  /// @dev returns the hash of operation, used as identifier
  function hashOperation(
    address target,
    uint256 value,
    uint256 salt
  ) public pure virtual returns (bytes32) {
    return keccak256(abi.encode(target, value, salt));
  }

  /// @dev set operation as scheduled
  function _schedule(
    address target,
    uint256 value,
    uint256 salt
  ) internal virtual notBlacklisted(target) returns (bytes32) {
    bytes32 id = hashOperation(target, value, salt);
    require(!isOperation(id), "operation already exists");

    uint256 timestamp = block.timestamp + _minDelay;
    _timestamps[id] = timestamp;

    emit CallScheduled(id, target, value, timestamp);
    return id;
  }

  /// @dev set operation as executed
  function _execute(
    address target,
    uint256 value,
    uint256 salt
  ) internal virtual notBlacklisted(target) returns (bytes32) {
    bytes32 id = hashOperation(target, value, salt);
    require(isOperationReady(id), "operation not ready");
    _timestamps[id] = _DONE_TIMESTAMP;

    emit CallExecuted(id, target, value);
    return id;
  }

  /// @dev set operation as cancelled. not permissioned here
  function _cancel(bytes32 id) internal virtual returns (bytes32) {
    require(isOperationPending(id), "operation not pending");
    _timestamps[id] = 0;

    emit CallCancelled(id);
    return id;
  }

  /// @dev update min delay
  function updateMinDelay(uint256 newMinDelay) external virtual onlyOwner {
    _minDelay = newMinDelay;
  }

  /// @dev blacklist an address
  function blacklist(address target) external virtual onlyAdmin {
    _blacklist[target] = true;
  }

  /// @dev unblacklist an address
  function unblacklist(address target) external virtual onlyAdmin {
    _blacklist[target] = false;
  }

  /// @dev update an admin role
  function updateAdmin(address target, bool enabled) external virtual onlyOwner {
    _adminRoles[target] = enabled;
  }
}
