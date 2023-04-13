// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IWorld } from "solecs/interfaces/IWorld.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { getAddressById } from "solecs/utils.sol";
import { ID as MintSystemID } from "systems/ERC20WithdrawSystem.sol";
import { ID as BurnSystemID } from "systems/ERC20DepositSystem.sol";

import { ERC20 } from "solmate/tokens/ERC20.sol";

// a non-upgradable implementation of a baic ERC20 with mint/burn functionality
// although it isn't a system, it uses systemIDs for permissions
// 2 systems are used:
// 1) ERC20WithdrawSystem: mints ERC20 and sends to an EOA
// 2) ERC20DepositSystem: burns ERC20 and sends to an in game Entity
// otherwise, the ERC20 is completely normal.
// Coins are considered 'out of game' and cannot be touched by in game systems

contract KamiERC20 is ERC20 {
  IWorld immutable World;

  modifier onlySystem(uint256 systemID) {
    IUintComp Systems = World.systems();
    require(getAddressById(Systems, systemID) == msg.sender, "not verified system");
    _;
  }

  constructor(IWorld _world, string memory _name, string memory _symbol) ERC20(_name, _symbol, 18) {
    World = _world;
  }

  // mints ERC20 tokens from game world. only can be called by MintSystem
  function withdraw(address to, uint256 amount) external onlySystem(MintSystemID) {
    super._mint(to, amount);
  }

  // burns ERC20 tokens to bring back into game world. only can be called by BurnSystem
  function deposit(address from, uint256 amount) external onlySystem(BurnSystemID) {
    super._burn(from, amount);
  }
}
