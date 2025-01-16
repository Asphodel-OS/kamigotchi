// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import "solecs/BareComponent.sol";

import { Stat, StatLib } from "solecs/components/types/Stat.sol";

contract StatComponent is BareComponent {
  constructor(address world, uint256 id) BareComponent(world, id) {}

  function set(uint256 entity, Stat memory value) external virtual onlyWriter {
    _set(entity, value);
  }

  function set(uint256[] memory entities, Stat[] memory values) external virtual onlyWriter {
    _set(entities, StatLib.encodeBatch(values));
  }

  function extract(uint256 entity) external virtual onlyWriter returns (Stat memory) {
    return StatLib.decode(_extractRaw(entity));
  }

  function extract(uint256[] memory entities) external virtual onlyWriter returns (Stat[] memory) {
    return StatLib.decodeBatch(_extractRaw(entities));
  }

  function get(uint256 entity) external view virtual returns (Stat memory) {
    return _get(entity);
  }

  function get(uint256[] memory entities) external view virtual returns (Stat[] memory) {
    return StatLib.decodeBatch(_getRaw(entities));
  }

  function safeGet(uint256 entity) external view virtual returns (Stat memory) {
    return StatLib.safeDecode(_getRaw(entity));
  }

  function safeGet(uint256[] memory entities) external view virtual returns (Stat[] memory) {
    return StatLib.safeDecodeBatch(_getRaw(entities));
  }

  //////////////
  // CALCS

  // calculate the stat total = ((1 + boost) * (base + shift))
  /// @dev deprecated
  function deprecatedCalcTotal(uint256 entity) external view virtual returns (int32) {
    Stat memory value = _get(entity);
    return StatLib.deprecatedCalcTotal(value);
  }

  // adjust the shift value of the stat.
  function shift(uint256 entity, int32 amt) external onlyWriter returns (int32) {
    Stat memory value = _get(entity);
    value.shift = StatLib.shift(value, amt);
    _set(entity, value);
    return value.shift;
  }

  // adjust the boost value of the stat. an adjustment on baseline 1000 (100.0%)
  function boost(uint256 entity, int32 amt) external onlyWriter returns (int32) {
    Stat memory value = _get(entity);
    value.boost = StatLib.boost(value, amt);
    _set(entity, value);
    return value.boost;
  }

  // adjust the sync value of the stat. bound result between [0, calcTotal()]
  function deprecatedSync(uint256 entity, int32 amt) external onlyWriter returns (int32) {
    Stat memory value = _get(entity);
    value.sync = StatLib.deprecatedSync(value, amt, StatLib.deprecatedCalcTotal(value));
    _set(entity, value);
    return value.sync;
  }

  // adjust the sync value of the stat with a specified max value
  function deprecatedSync(
    uint256 entity,
    int32 amt,
    int32 max
  ) external onlyWriter returns (int32) {
    Stat memory value = _get(entity);
    value.sync = StatLib.deprecatedSync(value, amt, max);
    _set(entity, value);
    return value.sync;
  }

  ///////////////////
  // INTERNAL
  function _set(uint256 entity, Stat memory value) internal {
    super._set(entity, StatLib.encode(value));
  }

  function _get(uint256 entity) internal view returns (Stat memory) {
    return StatLib.decode(_getRaw(entity));
  }
}
