// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import { SafeCastLib } from "solady/utils/SafeCastLib.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID } from "solecs/utils.sol";

import { ProxyVIPScoreComponent, ID as ProxyVIPScoreCompID } from "components/ProxyVIPScoreComponent.sol";
import { VipScore } from "initia-vip/VipScore.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibConfig } from "libraries/LibConfig.sol";

// stage length: 2 weeks
// VIP_STAGES: [start, epoch_length]

library LibVIP {
  using SafeCastLib for uint256;

  //////////////
  // INTERACTIONS

  function inc(IUintComp components, uint256 accID, uint256 amount) internal {
    ProxyVIPScoreComponent(getAddrByID(components, ProxyVIPScoreCompID)).inc(
      getAddress(components),
      getStage(components),
      LibAccount.getOwner(components, accID),
      amount.toUint64()
    );
  }

  ////////////
  // GETTERS

  function getStage(IUintComp components) internal view returns (uint64) {
    uint32[8] memory stageInfo = LibConfig.getArray(components, "VIP_STAGE");
    uint256 start = stageInfo[0];
    uint256 epoch = stageInfo[1];
    return ((block.timestamp - start) / epoch).toUint64() + 1;
  }

  function getAddress(IUintComp components) internal view returns (address) {
    return LibConfig.getAddress(components, "VIP_SCORE_ADDRESS");
  }
}
