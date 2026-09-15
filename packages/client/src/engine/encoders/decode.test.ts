import { AbiCoder, ParamType } from 'ethers';
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
