// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import "deployment/Imports.sol";

/// @notice a contract to bypass foundry's public linked library msg.sender bug
contract WrapCaller {
  IWorld internal world;
  IUintComp internal components;

  constructor(IWorld _world, IUintComp _components) {
    world = _world;
    components = _components;
  }

  function accIncBalOf(uint256 accID, string memory _type, uint32 index, uint256 amount) external {
    LibAccount.incBalanceOf(world, components, accID, _type, index, amount);
  }

  function petSync(uint256 id) public {
    LibKami.sync(components, id);
  }
}
