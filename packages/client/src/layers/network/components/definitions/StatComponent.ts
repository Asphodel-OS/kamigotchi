import { defineComponent, Type, World } from '@mud-classic/recs';

export type StatComponent = ReturnType<typeof defineStatComponent>;

// Stat is a struct that holds the modifying values of a core stat.
// The given stat's total (on the entity) is calculated as:
// Total = (1 + boost) * (base + shift)
export function defineStatComponent(world: World, name: string, contractId: string) {
  return defineComponent(
    world,
    {
      base: Type.Number, // base value of the stat
      shift: Type.Number, // fixed +/- shift on the base stat
      boost: Type.Number, // % multiplier on post-shifted stat (3 decimals of precision)
      sync: Type.Number, // the last synced value of stat (optional, for depletable stats)
    },
    {
      id: name,
      metadata: {
        contractId: contractId,
      },
    }
  );
}
