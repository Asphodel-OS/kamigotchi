// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IWorld } from "solecs/interfaces/IWorld.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { getAddressById } from "solecs/utils.sol";
import { ProxyPermissionsMint20Component as PermissionsComp, ID as PermissionsCompID } from "components/ProxyPermissionsMint20Component.sol";

import { LibConfig } from "libraries/LibConfig.sol";

import { ERC20 } from "solmate/tokens/ERC20.sol";

// ERC20 mint token. This can be redeemed to mint a kami
// TODO: GDA should be implemented as a system that mints from here

contract Mint20 is ERC20 {
  IWorld immutable World;

  // replace totalSupply with totalMinted, because of burnt tokens
  // kept without decimals to work natively with game world
  uint256 public totalMinted;

  modifier onlyWriter() {
    require(
      PermissionsComp(getAddressById(World.components(), PermissionsCompID)).writeAccess(
        msg.sender
      ),
      "ERC20: not a writer"
    );
    _;
  }

  constructor(IWorld _world, string memory _name, string memory _symbol) ERC20(_name, _symbol, 18) {
    World = _world;
  }

  function getTotalMinted() external view returns (uint256) {
    return totalMinted;
  }

  //////////////////////////
  // SYSTEM INTERACTIONS

  // mints tokens to an EOA. only can be called by Mint20MintSystem or GDA
  // strictly adheres to totalMinted
  function mint(address to, uint256 amount) external onlyWriter {
    require(
      totalMinted + amount <= LibConfig.getValueOf(World.components(), "MINT_TOTAL_MAX"),
      "Mint20: totalMinted exceeded"
    );
    _mintFormatted(to, amount);
  }

  // burns ERC20 tokens to mint a kami token
  function burn(address from, uint256 amount) external onlyWriter {
    super._burn(from, _convertDP(amount));
  }

  //////////////////////////
  // INTERNAL

  // formatted version of _mint
  function _mintFormatted(address to, uint256 amount) internal {
    totalMinted += amount;
    super._mint(to, _convertDP(amount));
  }

  // converts decimal places between game and ERC20
  // game has no decimals
  function _convertDP(uint256 amount) internal view returns (uint256) {
    return amount * 10 ** decimals;
  }
}
