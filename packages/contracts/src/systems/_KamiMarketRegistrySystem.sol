// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { AuthRoles } from "libraries/utils/AuthRoles.sol";
import { LibConfig } from "libraries/LibConfig.sol";

uint256 constant ID = uint256(keccak256("system.kamimarket.registry"));

/// @notice Admin — set fee rates, max orders, vault address, enable/disable
contract _KamiMarketRegistrySystem is System, AuthRoles {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory) public onlyAdmin(components) returns (bytes memory) {
    return "";
  }

  /// @notice Set the fee rate array [precision, numerator, ...]
  function setFeeRate(uint32[8] memory rate) public onlyAdmin(components) {
    LibConfig.setArray(components, "KAMI_MARKET_FEE_RATE", rate);
  }

  /// @notice Set the fee recipient address
  function setFeeRecipient(address recipient) public onlyAdmin(components) {
    LibConfig.setAddress(components, "KAMI_MARKET_FEE_RECIPIENT", recipient);
  }

  /// @notice Set the max open orders per account
  function setMaxOrders(uint256 max) public onlyAdmin(components) {
    LibConfig.set(components, "MAX_KAMI_MARKET_ORDERS", max);
  }

  /// @notice Set the vault contract address
  function setVault(address vault) public onlyAdmin(components) {
    LibConfig.setAddress(components, "KAMI_MARKET_VAULT", vault);
  }

  /// @notice Enable or disable the marketplace
  function setEnabled(bool enabled) public onlyAdmin(components) {
    LibConfig.setBool(components, "KAMI_MARKET_ENABLED", enabled);
  }

  /// @notice Set the post-purchase cooldown duration in seconds (0 = disabled)
  function setPurchaseCooldown(uint256 cooldown) public onlyAdmin(components) {
    LibConfig.set(components, "KAMI_MARKET_PURCHASE_COOLDOWN", cooldown);
  }
}
