// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { ERC20 } from "solmate/tokens/ERC20.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { getAddressById } from "solecs/utils.sol";
import { ProxyPermissionsMint20Component as PermissionsComp, ID as PermissionsCompID } from "components/ProxyPermissionsMint20Component.sol";

import { LibConfig } from "libraries/LibConfig.sol";

/// @title Mint20 | $KAMI
/// @notice a non-upgradable implementation of a basic ERC20 with mint/burn functionality
/** @dev
 * uses a Component for Permissions; systems that can write to the ProxyComponent can write to this contract
 *
 * Systems will not handle minting this token.
 * instead, tokens will be minted to a multisig and manually distributed.
 * May have a 'BuyMint20' system in the future, where users buy Min20 with ETH.
 * Mint20 will be transferred to that system
 */
contract Mint20 is ERC20 {
  IWorld internal immutable World;

  // replace totalSupply with totalMinted, because of burnt tokens
  // kept without decimals to work natively with game world
  uint256 public totalMinted;
  bool public mintDisabled;

  /// @notice mirrors permissions from ProxyPermissionsComponent
  modifier onlyWriter() {
    require(
      PermissionsComp(getAddressById(World.components(), PermissionsCompID)).writeAccess(
        msg.sender
      ),
      "ERC20: not a writer"
    );
    _;
  }

  /// @notice mirrors permissions from ProxyPermissionsComponent
  modifier onlyOwner() {
    require(
      PermissionsComp(getAddressById(World.components(), PermissionsCompID)).owner() == msg.sender,
      "ERC20: not a writer"
    );
    _;
  }

  constructor(IWorld _world, string memory _name, string memory _symbol) ERC20(_name, _symbol, 18) {
    World = _world;
  }

  /// @notice permerantly disables future minting. Used to lock supply
  function disableMinting() external onlyOwner {
    mintDisabled = true;
  }

  //////////////////////////
  // SYSTEM INTERACTIONS

  /// @notice admin to mint tokens to multisig, until limit or minting is disabled
  /// @dev  multisig will handle token distribution
  function adminMint(address to, uint256 amount) external onlyOwner {
    require(!mintDisabled, "Mint20: minting disabled");
    _mintFormatted(to, amount);
  }

  /// @notice burns tokens. Pet721Mint calls this to mint a pet
  function burn(address from, uint256 amount) external onlyWriter {
    super._burn(from, _convertDP(amount));
  }

  /// @notice allow systems to mint tokens
  /// @dev  depreciated, but left in for testnet. will be removed
  function depreciatedMint(address to, uint256 amount) external onlyWriter {
    _mintFormatted(to, amount);
  }

  //////////////////////////
  // GETTERS
  function getTotalMinted() external view returns (uint256) {
    return totalMinted;
  }

  //////////////////////////
  // INTERNAL

  /// @notice formatted version of _mint
  function _mintFormatted(address to, uint256 amount) internal {
    totalMinted += amount;
    super._mint(to, _convertDP(amount));
  }

  /// @notice converts decimal places between game and ERC20; game has no decimals
  function _convertDP(uint256 amount) internal view returns (uint256) {
    return amount * 10 ** decimals;
  }
}
