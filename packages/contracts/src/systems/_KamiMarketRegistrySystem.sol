// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { AuthRoles } from "libraries/utils/AuthRoles.sol";
import { LibConfig } from "libraries/LibConfig.sol";
import { LibEntityType } from "libraries/utils/LibEntityType.sol";
import { LibKamiMarket } from "libraries/LibKamiMarket.sol";

uint256 constant ID = uint256(keccak256("system.kamimarket.registry"));

/// @notice Admin — set fee rates, vault address, enable/disable
contract _KamiMarketRegistrySystem is System, AuthRoles {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory) public onlyAdmin(components) returns (bytes memory) {
    return "";
  }

  /// @notice Set the fee rate array [precision, numerator, ...]
  /// @dev fee = price * rate[1] / 10^rate[0]. rate[1] must be <= 10^rate[0] (fee <= 100%).
  function setFeeRate(uint32[8] memory rate) public onlyAdmin(components) {
    require(rate[0] > 0, "KamiMarketRegistry: precision must be > 0");
    require(rate[1] <= 10 ** rate[0], "KamiMarketRegistry: fee rate > 100%");
    LibConfig.setArray(components, "KAMI_MARKET_FEE_RATE", rate);
  }

  /// @notice Rebuild the active-listing index (backfill after upgrade, or repair)
  /// @dev accepts only ACTIVE KAMI_LISTING entities; overwrites wholesale
  function rebuildListingIndex(uint256[] memory ids) public onlyAdmin(components) {
    for (uint256 i; i < ids.length; i++) {
      require(
        LibEntityType.isShape(components, ids[i], "KAMI_LISTING"),
        "KamiMarketRegistry: not a listing"
      );
      require(
        LibKamiMarket.isOrderActive(components, ids[i]),
        "KamiMarketRegistry: not active"
      );
    }
    LibKamiMarket.setListingIndex(components, ids);
  }

  /// @notice Set the fee recipient address
  function setFeeRecipient(address recipient) public onlyAdmin(components) {
    require(recipient != address(0), "KamiMarketRegistry: zero address");
    LibConfig.setAddress(components, "KAMI_MARKET_FEE_RECIPIENT", recipient);
  }

  /// @notice Set the vault contract address
  function setVault(address vault) public onlyAdmin(components) {
    require(vault.code.length > 0, "KamiMarketRegistry: vault not a contract");
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
