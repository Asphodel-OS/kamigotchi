// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "solecs/BareComponent.sol";

struct FarcasterData {
  uint32 fid;
  string username;
  string pfpURI;
}

uint256 constant ID = uint256(keccak256("component.Farcaster"));

contract FarcasterDataComponent is BareComponent {
  constructor(address world) BareComponent(world, ID) {}

  function getSchema()
    public
    pure
    override
    returns (string[] memory keys, LibTypes.SchemaValue[] memory values)
  {
    keys = new string[](3);
    values = new LibTypes.SchemaValue[](3);

    keys[0] = "fid";
    values[0] = LibTypes.SchemaValue.UINT32;

    keys[1] = "username";
    values[1] = LibTypes.SchemaValue.STRING;

    keys[2] = "pfpURI";
    values[2] = LibTypes.SchemaValue.STRING;
  }

  function set(uint256 entity, FarcasterData memory value) public onlyWriter {
    set(entity, abi.encode(value));
  }

  function getValue(uint256 entity) public view virtual returns (FarcasterData memory) {
    FarcasterData memory value = abi.decode(getRawValue(entity), (FarcasterData));
    return value;
  }
}
