// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

import { BalanceComponent, ID as BalanceCompID } from "components/BalanceComponent.sol";
import { LibAccount } from "libraries/LibAccount.sol";
import { LibTrait } from "libraries/LibTrait.sol";
import { LibRegistryItem } from "libraries/LibRegistryItem.sol";
import { Utils } from "utils/Utils.sol";

import { ID as PetSysID } from "systems/ERC721PetSystem.sol";

uint256 constant ID = uint256(keccak256("system._Init"));

// admin only system to _init everything
contract _InitSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    arguments = "";

    initFood();
    // initMods();

    // for erc721 pet
    BalanceComponent(getAddressById(components, BalanceCompID)).set(PetSysID, 0);

    return "";
  }

  function executeTyped() public onlyOwner returns (bytes memory) {
    return execute(abi.encode(new bytes(0)));
  }

  function initFood() internal {
    LibRegistryItem.createFood(world, components, 1, "food 1", 25);
    LibRegistryItem.createFood(world, components, 2, "food 2", 100);
    LibRegistryItem.createFood(world, components, 3, "food 3", 200);
  }

  function initMods() internal {
    LibTrait.createIndex(
      components,
      world,
      "BODY",
      1, // index
      1, // mod value
      "MUL",
      "INSECT",
      "Butterfly"
    );
    LibTrait.createIndex(
      components,
      world,
      "BODY",
      2, // index
      2, // mod value
      "MUL",
      "MECH",
      "Cube"
    );

    LibTrait.createIndex(
      components,
      world,
      "COLOR",
      1, // index
      1, // mod value
      "ADD",
      "",
      "Canto Green"
    );

    LibTrait.createIndex(
      components,
      world,
      "FACE",
      1, // index
      1, // mod value
      "UMUL",
      "",
      "c-c"
    );
    LibTrait.createIndex(
      components,
      world,
      "FACE",
      2, // index
      2, // mod value
      "UMUL",
      "",
      "uwu"
    );

    LibTrait.createIndex(
      components,
      world,
      "HAND",
      1, // index
      1, // mod value
      "STORAGE",
      "INSECT",
      "Slicers"
    );
    LibTrait.createIndex(
      components,
      world,
      "HAND",
      2, // index
      2, // mod value
      "STORAGE",
      "NORMAL",
      "Paws"
    );

    LibTrait.createIndex(
      components,
      world,
      "BACKGROUND",
      1, // index
      1, // mod value
      "UMUL",
      "",
      "background1"
    );
  }
}
