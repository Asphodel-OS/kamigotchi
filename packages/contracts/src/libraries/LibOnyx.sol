// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import { SafeCastLib } from "solady/utils/SafeCastLib.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID } from "solecs/utils.sol";
import { Base64 } from "solady/utils/Base64.sol";
import { LibString } from "solady/utils/LibString.sol";

import { ERC20 } from "solmate/tokens/ERC20.sol";

import { Kami721 } from "tokens/Kami721.sol";

import { MediaURIComponent, ID as MediaURICompID } from "components/MediaURIComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";

import { LibConfig } from "libraries/LibConfig.sol";

library LibOnyx {
  //////////////
  // INTERACTIONS

  function spend(IUintComp components, uint256 amount) internal {
    address to = address(uint160(LibConfig.get(components, "ONYX_RECEIVER_ADDRESS")));
    return transfer(components, msg.sender, to, amount);
  }

  function transfer(IUintComp components, address from, address to, uint256 amount) internal {
    ERC20 token = getERC20(components);
    token.transferFrom(from, to, amount);
  }

  ////////////
  // GETTERS

  function getERC20(IUintComp components) internal view returns (ERC20) {
    return ERC20(getAddress(components));
  }

  function getAddress(IUintComp components) internal view returns (address) {
    return address(uint160(LibConfig.get(components, "ONYX_ADDRESS")));
  }
}
