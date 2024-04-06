// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;
import "solecs/BareComponent.sol";

struct FunctionSelector {
  address contr;
  bytes4 func;
}

contract FunctionBareComponent is BareComponent {
  constructor(address world, uint256 id) BareComponent(world, id) {}

  function getSchema()
    public
    pure
    override
    returns (string[] memory keys, LibTypes.SchemaValue[] memory values)
  {
    keys = new string[](2);
    values = new LibTypes.SchemaValue[](2);

    keys[0] = "contr";
    values[0] = LibTypes.SchemaValue.ADDRESS;

    keys[1] = "func";
    values[1] = LibTypes.SchemaValue.BYTES4;
  }

  function set(uint256 entity, FunctionSelector memory value) public virtual {
    set(entity, abi.encode(value));
  }

  function setBatch(uint256[] memory entities, FunctionSelector[] memory values) public virtual {
    bytes[] memory rawValues = new bytes[](entities.length);
    for (uint256 i = 0; i < entities.length; i++) rawValues[i] = abi.encode(values[i]);

    setBatch(entities, rawValues);
  }

  function extract(uint256 entity) public virtual returns (FunctionSelector memory) {
    return abi.decode(extractRaw(entity), (FunctionSelector));
  }

  function extractBatch(
    uint256[] memory entities
  ) public virtual returns (FunctionSelector[] memory) {
    bytes[] memory rawValues = extractRawBatch(entities);
    FunctionSelector[] memory values = new FunctionSelector[](entities.length);
    for (uint256 i = 0; i < entities.length; i++)
      values[i] = abi.decode(rawValues[i], (FunctionSelector));
    return values;
  }

  function get(uint256 entity) public view virtual returns (FunctionSelector memory) {
    return abi.decode(getRaw(entity), (FunctionSelector));
  }

  function getBatch(
    uint256[] memory entities
  ) public view virtual returns (FunctionSelector[] memory) {
    bytes[] memory rawValues = getRawBatch(entities);
    FunctionSelector[] memory values = new FunctionSelector[](entities.length);
    for (uint256 i = 0; i < entities.length; i++)
      values[i] = abi.decode(rawValues[i], (FunctionSelector));
    return values;
  }
}

function staticcallFunctionSelector(
  FunctionSelector memory functionSelector,
  bytes memory args
) view returns (bool, bytes memory) {
  return functionSelector.contr.staticcall(bytes.concat(functionSelector.func, args));
}
