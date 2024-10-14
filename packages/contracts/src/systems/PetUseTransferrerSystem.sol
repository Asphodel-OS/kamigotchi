// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";

import { KamiTransferrerComponent, ID as KamiTransferrerCompID } from "components/KamiTransferrerComponent.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibItem } from "libraries/LibItem.sol";
import { LibInventory } from "libraries/LibInventory.sol";
import { LibHarvest } from "libraries/LibHarvest.sol";
import { LibPet } from "libraries/LibPet.sol";

uint256 constant ID = uint256(keccak256("system.pet.use.transferrer"));

// testnet specific system for transferring t1->t2
contract PetUseTransferrerSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256 petID, uint32 itemIndex) = abi.decode(arguments, (uint256, uint32));
    uint256 accID = LibAccount.getByOperator(components, msg.sender);

    // item checks
    require(LibItem.isTypeOf(components, itemIndex, "TRANSFERRER"), "that's not a transferer");
    require(LibItem.isForPet(components, itemIndex), "that's not for pets");

    // pet checks
    LibPet.assertAccount(components, petID, accID);
    LibPet.assertRoom(components, petID, accID);
    require(!LibPet.onCooldown(components, petID), "pet on cooldown");
    require(
      LibPet.isResting(components, petID) || LibPet.isHarvesting(components, petID),
      "pet must be alive"
    );

    // use item
    LibPet.sync(components, petID);
    LibInventory.decFor(components, accID, itemIndex, 1); // implicit balance check
    KamiTransferrerComponent(getAddrByID(components, KamiTransferrerCompID)).set(petID, petID);

    // reset the pet's intensity
    if (LibPet.isHarvesting(components, petID)) {
      uint256 productionID = LibPet.getProduction(components, petID);
      LibHarvest.resetIntensity(components, productionID);
    }

    // standard logging and tracking
    LibItem.logUse(components, accID, itemIndex, 1);
    LibAccount.updateLastTs(components, accID);

    return "";
  }

  function executeTyped(uint256 petID, uint32 itemIndex) public returns (bytes memory) {
    return execute(abi.encode(petID, itemIndex));
  }
}
