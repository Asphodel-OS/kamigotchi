import { ComponentValue } from '@mud-classic/recs';
import { BytesLike, defaultAbiCoder as abi } from 'ethers/lib/utils';

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
  async function decode(componentID: string, data: BytesLike): Promise<ComponentValue> {
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
