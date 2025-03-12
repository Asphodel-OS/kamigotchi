import { ComponentValue } from '@mud-classic/recs';
import { BigNumber } from 'ethers';
import { BytesLike, defaultAbiCoder as abi } from 'ethers/lib/utils';

import { ComponentsSchema } from 'types/ComponentsSchema';
import {
  ContractSchemaValue,
  ContractSchemaValueArrayToElement,
  ContractSchemaValueId,
  ContractSchemaValueTypes,
} from './types';

function flattenValue<V extends ContractSchemaValue>(
  value: BigNumber | BigNumber[] | number | number[] | boolean | boolean[] | string | string[],
  valueType: V
): ContractSchemaValueTypes[V] {
  // If value is array, recursively flatten elements
  if (Array.isArray(value))
    return value.map((v) =>
      flattenValue(v, ContractSchemaValueArrayToElement[valueType])
    ) as unknown as ContractSchemaValueTypes[V]; // Typescript things it is possible we return a nested array, but it is not

  // Value is already flat
  if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean')
    return value as ContractSchemaValueTypes[V];

  // The value returned by abi.decode is Hexable but not a ethers.BigNumber
  value = BigNumber.from(value);

  // Value is a representable number
  if (
    [
      ContractSchemaValue.INT8,
      ContractSchemaValue.INT16,
      ContractSchemaValue.INT32,
      ContractSchemaValue.UINT8,
      ContractSchemaValue.UINT16,
      ContractSchemaValue.UINT32,
    ].includes(valueType)
  ) {
    return value.toNumber() as ContractSchemaValueTypes[V];
  }

  // Value should be represented as a hex string
  if (
    [
      ContractSchemaValue.INT64,
      ContractSchemaValue.INT128,
      ContractSchemaValue.INT256,
      ContractSchemaValue.UINT64,
      ContractSchemaValue.UINT128,
      ContractSchemaValue.UINT256,
      ContractSchemaValue.BYTES,
      ContractSchemaValue.ADDRESS,
      ContractSchemaValue.BYTES4,
    ].includes(valueType)
  ) {
    return value.toHexString() as ContractSchemaValueTypes[V];
  }

  // Value should be represented a plain string
  if ([ContractSchemaValue.STRING].includes(valueType)) {
    return value.toString() as ContractSchemaValueTypes[V];
  }

  throw new Error('Unknown value type');
}

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
  return (data: BytesLike) => {
    // Decode data with the schema values provided by the component
    const decoded = abi.decode(
      valueTypes.map((valueType) => ContractSchemaValueId[valueType]),
      data
    );

    // Now keys and valueTypes lengths must match
    if (keys.length !== valueTypes.length) {
      throw new Error('Component schema keys and values length does not match');
    }

    // Construct the client component value
    const result: Partial<{ [key in keyof D]: unknown }> = {};
    for (let i = 0; i < keys.length; i++) {
      result[keys[i]!] = flattenValue(decoded[i], valueTypes[i]!);
    }

    return result as D;
  };
}

/**
 * Create a function to decode raw component values.
 * Fetches component schemas from the contracts and caches them.
 *
 * @param worldConfig Contract address and interface of the World contract
 * @param provider ethers JsonRpcProvider
 * @returns Function to decode raw component values using their contract component id
 */
export function createDecode() {
  const decoders: { [key: string]: (data: BytesLike) => ComponentValue } = {};
  // hardcode world.component.components and world.component.systems to use uint256 schema
  // NOTE: maybe compute these keys with keccaks or keep a constants file for readability
  decoders['0x4350dba81aa91e31664a09d24a668f006169a11b3d962b7557aed362d3252aec'] = createDecoder(
    ['value'],
    [13]
  ); // world.component.components
  decoders['0x017c816a964927a00e050edd780dcf113ca2756dfa9e9fda94a05c140d9317b0'] = createDecoder(
    ['value'],
    [13]
  ); // world.component.systems
  async function decode(componentId: string, data: BytesLike): Promise<ComponentValue> {
    if (!decoders[componentId]) {
      // debug('Creating decoder for', componentId);
      const compID = componentId as keyof typeof ComponentsSchema;
      let schema = ComponentsSchema[compID];
      if (!schema) {
        console.warn(`No schema found for component ${String(compID)}`);
        // set bool as a default schema - only to prevent errors
        // TODO: whitelist components to listen to (need in snapshot & here)
        schema = { keys: ['value'], values: [0] };
      }
      decoders[componentId] = createDecoder(schema.keys, schema.values);
    }
    // Decode the raw value
    return decoders[componentId]!(data);
  }

  return decode;
}
