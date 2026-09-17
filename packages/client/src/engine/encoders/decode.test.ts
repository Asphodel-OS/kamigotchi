import { AbiCoder, getBytes, ParamType } from 'ethers';
import { describe, expect, it } from 'vitest';

import { createDecoder } from './decode';
import { ContractSchemaValue, ContractSchemaValueId } from './types';

const coder = AbiCoder.defaultAbiCoder();

// createDecoder pre-parses its types into ParamType once instead of handing ethers raw
// strings on every call, which is what took the per-row cost from 17us to something
// sane. That is only safe if a ParamType decodes identically to the string it came from,
// for every type the schema map can produce — this decodes both ways and compares. If
// ethers ever diverges on a type, a silently wrong value reaches every component in the
// game, so it is checked rather than assumed.
const sampleFor = (type: string): unknown => {
  if (type.endsWith('[]')) {
    const base = type.slice(0, -2);
    return [sampleFor(base), sampleFor(base)];
  }
  if (type === 'bool') return true;
  if (type === 'address') return '0x2729174c265dbBd8416C6449E0E813E88f43D0E7';
  if (type === 'string') return 'kamigotchi';
  if (type === 'bytes') return '0xdeadbeef';
  if (type.startsWith('bytes')) return '0xdeadbeef';
  if (type.startsWith('uint') || type.startsWith('int')) return 42n;
  throw new Error(`no sample for ${type}`);
};

const stable = (value: unknown) =>
  JSON.stringify(value, (_, v) => (typeof v === 'bigint' ? v.toString() : v));

const everyType = Object.values(ContractSchemaValueId);

describe('createDecoder', () => {
  it.each(everyType)('decodes %s identically via ParamType and via string', (type) => {
    const encoded = coder.encode([type], [sampleFor(type)]);

    expect(stable(coder.decode([ParamType.from(type)], encoded))).toBe(
      stable(coder.decode([type], encoded))
    );
  });

  it('decodes a multi-field schema into its keys', () => {
    const decode = createDecoder<{ amount: unknown; flag: unknown }>(
      ['amount', 'flag'],
      [ContractSchemaValue.UINT256, ContractSchemaValue.BOOL]
    );

    const encoded = coder.encode(['uint256', 'bool'], [7n, true]);

    // flattenValue renders the wide integer types as hex rather than bigint
    expect(decode(encoded)).toEqual({ amount: '0x7', flag: true });
  });

  // The length check moved out of the returned closure, so it now fires when the decoder
  // is built rather than on first use. Worth pinning: it is the difference between a
  // mismatched schema failing at startup and failing three million rows into a load.
  it('rejects a mismatched schema when the decoder is created, not on first decode', () => {
    expect(() =>
      createDecoder(['onlyOneKey'], [ContractSchemaValue.UINT256, ContractSchemaValue.BOOL])
    ).toThrow(/length does not match/);
  });

  it('returns the same values across repeated calls on one decoder', () => {
    const wide = createDecoder<{ value: unknown }>(['value'], [ContractSchemaValue.UINT256]);
    const narrow = createDecoder<{ value: unknown }>(['value'], [ContractSchemaValue.UINT32]);

    const encoded = coder.encode(['uint256'], [123n]);
    const narrowEncoded = coder.encode(['uint32'], [123n]);

    // the coder is built once per decoder now, so repeated calls must not drift
    expect(wide(encoded)).toEqual(wide(encoded));
    expect(wide(encoded)).toEqual({ value: '0x7b' });
    expect(narrow(narrowEncoded)).toEqual({ value: 123 });
  });
});

// The fast path bypasses ethers for single unsigned scalars and bools, which is 74 of the
// 95 component schemas. It is only safe if it agrees with the coder on every value, so
// these decode the same bytes both ways rather than asserting an expected literal —
// a wrong expectation would otherwise just bake the bug in.
describe('createDecoder fast path', () => {
  const viaAbi = (type: string, valueType: ContractSchemaValue, encoded: string) => {
    // a hex string never takes the fast path, so this is the coder's answer by construction
    return createDecoder<{ value: unknown }>(['value'], [valueType])(encoded);
  };
  const viaFast = (valueType: ContractSchemaValue, encoded: string) => {
    return createDecoder<{ value: unknown }>(['value'], [valueType])(getBytes(encoded));
  };

  const agree = (type: string, valueType: ContractSchemaValue, value: unknown) => {
    const encoded = coder.encode([type], [value]);
    expect(viaFast(valueType, encoded), `${type} = ${value}`).toEqual(
      viaAbi(type, valueType, encoded)
    );
  };

  it.each([
    ['uint256', ContractSchemaValue.UINT256],
    ['uint128', ContractSchemaValue.UINT128],
    ['uint64', ContractSchemaValue.UINT64],
  ])('%s matches the coder across magnitudes', (type, valueType) => {
    const bits = BigInt(type.replace('uint', ''));
    for (const v of [
      0n, // renders '0x0', the one case with no significant byte
      1n,
      10n, // 0xa — single nibble, the leading-zero-nibble trap
      15n,
      16n, // 0x10 — two nibbles
      255n,
      256n,
      0xdeadbeefn,
      (1n << (bits - 1n)) - 1n,
      (1n << bits) - 1n, // max, every byte significant
    ]) {
      agree(type, valueType, v);
    }
  });

  it.each([
    ['uint32', ContractSchemaValue.UINT32],
    ['uint16', ContractSchemaValue.UINT16],
    ['uint8', ContractSchemaValue.UINT8],
  ])('%s matches the coder and stays a number', (type, valueType) => {
    const bits = Number(type.replace('uint', ''));
    const max = 2 ** bits - 1;
    for (const v of [0, 1, 127, 128, 255, Math.floor(max / 2), max]) {
      agree(type, valueType, BigInt(v));
    }
    expect(viaFast(valueType, coder.encode([type], [max]))).toEqual({ value: max });
  });

  it('bool matches the coder', () => {
    agree('bool', ContractSchemaValue.BOOL, true);
    agree('bool', ContractSchemaValue.BOOL, false);
  });

  // Types the fast path declines have to keep working, via the coder.
  it.each([
    ['string', ContractSchemaValue.STRING, 'kamigotchi'],
    ['int32', ContractSchemaValue.INT32, -7n],
    ['int256', ContractSchemaValue.INT256, -123456789n],
    ['uint32[]', ContractSchemaValue.UINT32_ARRAY, [1n, 2n, 3n]],
  ])('%s still decodes through the coder', (type, valueType, value) => {
    const encoded = coder.encode([type], [value]);
    const decoded = createDecoder<{ value: unknown }>(['value'], [valueType])(getBytes(encoded));

    expect(decoded).toEqual(createDecoder<{ value: unknown }>(['value'], [valueType])(encoded));
  });
});
