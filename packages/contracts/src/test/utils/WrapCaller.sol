// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

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

  function alloDistribute(uint256[] memory ids, uint256 multiplier, uint256 targetID) public {
    LibAllo.distribute(world, components, ids, multiplier, targetID);
  }

  function kamiSync(uint256 id) public {
    LibKami.sync(components, id);
  }

  function setterUpdate(
    string memory _type,
    uint32 index,
    uint256 amount,
    uint256 targetID
  ) public {
    LibSetter.update(world, components, _type, index, amount, targetID);
  }

  function setterDec(string memory _type, uint32 index, uint256 amount, uint256 targetID) public {
    LibSetter.dec(components, _type, index, amount, targetID);
  }
}
