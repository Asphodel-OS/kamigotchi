import { ComponentValue } from 'engine/recs';
import { AbiCoder, BytesLike, ParamType } from 'ethers';

import { ComponentsSchema } from 'types/ComponentsSchema';
import { ContractSchemaValue, ContractSchemaValueId } from './types';
import { flattenValue } from './utils';

const COMPONENTS_KEY = '0x4350dba81aa91e31664a09d24a668f006169a11b3d962b7557aed362d3252aec';
const SYSTEMS_KEY = '0x017c816a964927a00e050edd780dcf113ca2756dfa9e9fda94a05c140d9317b0';

export type Decode = ReturnType<typeof createDecode>;

/**
 * Create a function to decode raw component values.
 * Fetches component schemas from the contracts and caches them.
 *
 * @returns Function to decode raw component values using their contract component id
 */
export const createDecode = () => {
  const decoders: { [key: string]: (data: BytesLike) => ComponentValue } = {};

  // hardcode world.component.components and world.component.systems to use uint256 schema
  // TODO: probably worth just precomputing these values in the contract build scripts
  decoders[COMPONENTS_KEY] = createDecoder(['value'], [13]); // world.component.components
  decoders[SYSTEMS_KEY] = createDecoder(['value'], [13]); // world.component.systems

  // generate the decode function components
  function decode(componentID: string, data: BytesLike): ComponentValue {
    if (!decoders[componentID]) {
      const compID = componentID as keyof typeof ComponentsSchema;
      let schema = ComponentsSchema[compID];

      // set bool as a default schema - only to prevent errors
      if (!schema) {
        console.warn(`No schema found for component ${String(compID)}`);
        schema = { keys: ['value'], values: [0] };
      }

      decoders[componentID] = createDecoder(schema.keys, schema.values);
    }
    // Decode the raw value
    return decoders[componentID]!(data);
  }

  return decode;
};

/**
 * Construct a decoder function from given keys and valueTypes.
 * The consumer is responsible for providing a type D matching the keys and valueTypes.
 *
 * @param keys Keys of the component value schema.
 * @param valueTypes Value types if the component value schema.
 * @returns Function to decode encoded hex value to component value.
 */
export function createDecoder<D extends { [key: string]: unknown }>(
  keys: (keyof D)[],
  valueTypes: ContractSchemaValue[]
): (data: BytesLike) => D {
  if (keys.length !== valueTypes.length) {
    throw new Error('Component schema keys and values length does not match');
  }

  // Everything here is fixed once the decoder exists, but the closure below runs once per
  // state row — about 3 million times on a prod cold boot. Rebuilding the type array and
  // handing ethers raw strings meant re-parsing each type into a ParamType on every row,
  // which measured 17us/row and 95% of a 56s load. Entities, which never reach this path,
  // cost 1.5us/row. Pre-parsing to ParamType is what keeps it out of the hot loop.
  const coder = AbiCoder.defaultAbiCoder();
  const paramTypes = valueTypes.map((valueType) =>
    ParamType.from(ContractSchemaValueId[valueType])
  );

  const decodeViaAbi = (data: BytesLike): D => {
    const decoded = coder.decode(paramTypes, data);

    const result: Partial<{ [key in keyof D]: unknown }> = {};
    for (let i = 0; i < keys.length; i++) {
      result[keys[i]!] = flattenValue(decoded[i], valueTypes[i]!);
    }

    return result as D;
  };

  // Every component in the schema is a single value and none are multi-field, and 74 of
  // the 95 are an unsigned integer or a bool. For those the ABI encoding is one 32-byte
  // word — no offset table, no dynamic section — so the coder dispatch and the Result
  // proxy ethers builds are machinery for complexity this case does not have.
  //
  // Signed integers are deliberately excluded: they are two's complement, and matching
  // flattenValue's output for a negative would mean reimplementing its sign handling for
  // four components. Strings, bytes and arrays are dynamic. All of them take the coder.
  const fast = keys.length === 1 ? fastWordReader(valueTypes[0]!) : undefined;
  if (!fast) return decodeViaAbi;

  const key = keys[0]!;
  return (data: BytesLike) => {
    // Only the protobuf path hands us raw bytes; hex strings and anything not exactly one
    // word falls through to the coder rather than growing a second parser here.
    if (!(data instanceof Uint8Array) || data.length !== WORD_BYTES) return decodeViaAbi(data);

    return { [key]: fast(data) } as D;
  };
}

const WORD_BYTES = 32;
const HEX_DIGITS = '0123456789abcdef';

// Mirrors flattenValue for a single 32-byte word: the wide unsigned types render as
// '0x' + bigint.toString(16), which is the word with leading zeros stripped and no
// padding, and the narrow ones render as a plain number.
const wordToHex = (data: Uint8Array): string => {
  let i = 0;
  while (i < WORD_BYTES && data[i] === 0) i++;
  if (i === WORD_BYTES) return '0x0';

  const first = data[i]!;
  let out =
    first < 16 ? '0x' + HEX_DIGITS[first] : '0x' + HEX_DIGITS[first >> 4] + HEX_DIGITS[first & 15];
  for (let j = i + 1; j < WORD_BYTES; j++) {
    const byte = data[j]!;
    out += HEX_DIGITS[byte >> 4] + HEX_DIGITS[byte & 15];
  }
  return out;
};

// A uint32 or narrower occupies the low four bytes. No check that the bytes above them are
// clear, deliberately: ethers masks an over-wide word to the low bits rather than
// rejecting it, so reading the low four bytes IS the coder's answer, verified against it up
// to max uint256. Guarding would cost a 28-byte scan per row to reach an identical result
// by the slow path. Whether masking is the right response to malformed data is a question
// for both paths at once, not something to diverge on here.
const wordToNumber = (data: Uint8Array): number =>
  data[28]! * 16777216 + data[29]! * 65536 + data[30]! * 256 + data[31]!;

const fastWordReader = (
  valueType: ContractSchemaValue
): ((data: Uint8Array) => unknown) | undefined => {
  switch (valueType) {
    case ContractSchemaValue.BOOL:
      return (data) => data[WORD_BYTES - 1] !== 0;
    case ContractSchemaValue.UINT8:
    case ContractSchemaValue.UINT16:
    case ContractSchemaValue.UINT32:
      return wordToNumber;
    case ContractSchemaValue.UINT64:
    case ContractSchemaValue.UINT128:
    case ContractSchemaValue.UINT256:
      return wordToHex;
    default:
      return undefined;
  }
};
