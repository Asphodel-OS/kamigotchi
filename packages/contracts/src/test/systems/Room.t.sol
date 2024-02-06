// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "test/utils/SetupTemplate.s.sol";

contract RoomTest is SetupTemplate {
  //////////////
  // UTILS

  function testUintConversion(int32 x, int32 y, int32 z) public {
    Location memory original = Location(x, y, z);
    uint256 converted = LibRoom.locationToUint256(original);
    Location memory postConvert = LibRoom.uint256ToLocation(converted);

    console.log(converted);
    console.log("ogx");
    console.log(uint(int256(original.x)));
    console.log("ogy");
    console.log(uint(int256(original.y)));
    console.log("ogz");
    console.log(uint(int256(original.z)));
    console.log("cx");
    console.log(uint(int256(postConvert.x)));
    console.log("cy");
    console.log(uint(int256(postConvert.y)));
    console.log("cz");
    console.log(uint(int256(postConvert.z)));

    assertEq(original, postConvert);
  }
}
