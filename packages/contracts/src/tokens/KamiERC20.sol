// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IWorld } from "solecs/interfaces/IWorld.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { getAddressById } from "solecs/utils.sol";
import { ProxyPermissionsERC20Component as PermissionsComp, ID as PermissionsCompID } from "components/ProxyPermissionsERC20Component.sol";

import { ERC20 } from "solmate/tokens/ERC20.sol";

// a non-upgradable implementation of a basic ERC20 with mint/burn functionality
// uses a Component for Permissions; systems that can write to the ProxyComponent can write to this contract
// 2 systems are used (may be upgraded in the future):
// 1) ERC20WithdrawSystem: mints ERC20 and sends to an EOA
// 2) ERC20DepositSystem: burns ERC20 and sends to an in game Entity
// otherwise, the ERC20 is completely normal.
// Coins are considered 'out of game' and cannot be touched by in game systems

contract KamiERC20 is ERC20 {
  IWorld immutable World;

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

  //////////////////////////
  // SYSTEM INTERACTIONS

  // mints ERC20 tokens from game world. only can be called by MintSystem
  function withdraw(address to, uint256 amount) external onlyWriter {
    super._mint(to, _convertDP(amount));
  }

  // burns ERC20 tokens to bring back into game world. only can be called by BurnSystem
  function deposit(address from, uint256 amount) external onlyWriter {
    super._burn(from, _convertDP(amount));
  }

  //////////////////////////
  // INTERNAL

  // converts decimal places between game and ERC20
  // game has no decimals
  function _convertDP(uint256 amount) internal view returns (uint256) {
    return amount * 10 ** decimals;
  }
}
