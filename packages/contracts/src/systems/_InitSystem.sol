// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { BalanceComponent, ID as BalanceCompID } from "components/BalanceComponent.sol";
import { ID as PetSysID } from "systems/ERC721MintSystem.sol";

import { LibScore } from "libraries/LibScore.sol";

uint256 constant ID = uint256(keccak256("system._Init"));

// admin only system to _init everything
contract _InitSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    arguments = "";

    // for erc721 pet
    // TODO: move this to registration API or rename this file
    BalanceComponent(getAddressById(components, BalanceCompID)).set(PetSysID, 0);
    LibScore.setLeaderboardEpoch(components, 1);

    return "";
  }

  function executeTyped() public onlyOwner returns (bytes memory) {
    return execute(abi.encode(new bytes(0)));
  }
}
