// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { SafeCastLib } from "solady/utils/SafeCastLib.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID } from "solecs/utils.sol";

import { ProxyVIPScoreComponent as VIPComponent, ID as VIPCompID } from "components/ProxyVIPScoreComponent.sol";
import { VipScore } from "utils/VipScore.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibConfig } from "libraries/LibConfig.sol";
import { LibScore } from "libraries/LibScore.sol";

// stage length: 2 weeks
// VIP_STAGES: [start, epoch_length]

/**
 * @notice integration with initia VIP
 * @dev uses LibScore with epoch
 */

library LibVIP {
  using SafeCastLib for uint256;

  //////////////
  // INTERACTIONS

  /// @dev includes prev stage finalize logic
  function inc(IUintComp comps, uint256 accID, uint256 amount) internal {
    address vipAddr = getAddress(comps);
    uint256 currStage = getStage(comps);

    // update MUD score
    LibScore.incFor(comps, accID, currStage, 0, "VIP_SCORE", amount);

    // score VIP
    VIPComponent vipComp = VIPComponent(getAddrByID(comps, VIPCompID));
    finalizePrevStage(vipComp, vipAddr, currStage.toUint64());
    vipComp.inc(
      vipAddr,
      currStage.toUint64(),
      LibAccount.getOwner(comps, accID),
      amount.toUint64()
    );
  }

  function finalizePrevStage(VIPComponent vipComp, address vipAddr, uint64 currStage) internal {
    VipScore vip = VipScore(vipAddr);
    if (currStage == 1 || currStage == 0) return; // no need to finalize 0 stage

    (, , bool isFinalized) = vip.stages(currStage - 1);
    if (isFinalized) return; // already finalized
    vipComp.finalizeStage(vipAddr, currStage - 1);
  }

  ////////////
  // GETTERS

  function getStage(IUintComp comps) internal view returns (uint256) {
    uint32[8] memory stageInfo = LibConfig.getArray(comps, "VIP_STAGE");
    uint256 start = stageInfo[0];
    uint256 epoch = stageInfo[1];
    return ((block.timestamp - start) / epoch) + 1;
  }

  function getAddress(IUintComp comps) internal view returns (address) {
    return LibConfig.getAddress(comps, "VIP_SCORE_ADDRESS");
  }
}
