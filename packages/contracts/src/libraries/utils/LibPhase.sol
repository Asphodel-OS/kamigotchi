// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

///@notice library for 36h day/evening/night cycle in Kamigotchi World
library LibPhase {
  // enum Phase {
  //   NULL, // invalid phase; used to represent 0
  //   DAYLIGHT, // 1
  //   EVENFALL, // 2
  //   MOONSIDE // 3
  // }

  function get(uint256 time) internal pure returns (uint32) {
    return uint32(_get(time));
  }

  function getName(uint256 time) internal pure returns (string memory) {
    return _getName(_get(time));
  }

  /////////////////////
  // INTERNAL

  /// @notice get the current phase of the day
  /// @dev raw uint256 form, skips a conversion step
  function _get(uint256 time) internal pure returns (uint256) {
    uint256 hour = (time / 3600) % 36;
    return (hour / 12) + 1; // start at 1
  }

  function _getName(uint256 phase) internal pure returns (string memory) {
    if (phase == 1) return "DAYLIGHT";
    else if (phase == 2) return "EVENFALL";
    else if (phase == 3) return "MOONSIDE";
    else return "";
  }
}
