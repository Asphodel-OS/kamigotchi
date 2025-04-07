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

  /// @dev includes prev stage finalize logic
  function inc(IUintComp comps, uint256 accID, uint256 amount) internal {
    address vipAddr = getAddress(comps);
    uint64 currStage = getStage(comps);
    ProxyVIPScoreComponent vipComp = ProxyVIPScoreComponent(
      getAddrByID(comps, ProxyVIPScoreCompID)
    );

    finalizePrevStage(vipComp, vipAddr, currStage);
    vipComp.inc(vipAddr, currStage, LibAccount.getOwner(comps, accID), amount.toUint64());
  }

  function finalizePrevStage(
    ProxyVIPScoreComponent vipComp,
    address vipAddr,
    uint64 currStage
  ) internal {
    VipScore vip = VipScore(vipAddr);
    if (currStage == 1 || currStage == 0) return; // no need to finalize 0 stage

    (, , bool isFinalized) = vip.stages(currStage - 1);
    if (isFinalized) return; // already finalized
    vipComp.finalizeStage(vipAddr, currStage - 1);
  }

  ////////////
  // GETTERS

  function getStage(IUintComp comps) internal view returns (uint64) {
    uint32[8] memory stageInfo = LibConfig.getArray(comps, "VIP_STAGE");
    uint256 start = stageInfo[0];
    uint256 epoch = stageInfo[1];
    return ((block.timestamp - start) / epoch).toUint64() + 1;
  }

  function getAddress(IUintComp comps) internal view returns (address) {
    return LibConfig.getAddress(comps, "VIP_SCORE_ADDRESS");
  }
}
