import { Component, EntityID, EntityIndex, World, getComponentValue } from '@mud-classic/recs';

import { Components } from 'network/';
import { accounts } from './accounts';
import { addresses } from './addresses';
import { auctions } from './auctions';
import { configs } from './configs';
import { data } from './data/data';
import { factions } from './factions';
import { goals } from './goals';
import { items } from './items';
import { kamis } from './kamis';
import { nodes } from './nodes';
import { npcs } from './npcs';
import { quests } from './quests';
import { recipes } from './recipes';
import { rooms } from './rooms';
import { skills } from './skills';
import { traits } from './traits';

// explorer for our 'shapes', exposed on the window object @ network.explorer
export const initExplorer = (world: World, components: Components) => {
  // parses a component value based on its schema
  function parseValue(c: Component, v: any) {
    const type = c.schema.value;
    if (type === 0) return v; // boolean
    if (type === 3) return v; // string
    if (type === 1) return parseInt(v, 16); // number
    if (type === 5) return v.map((s: string) => parseInt(s, 16)); // number[]
    return v;
  }

  // gets an entity by its entity index
  function getEntity(index: EntityIndex) {
    const entity = {} as any;
    Object.values(components).forEach((component) => {
      // @ts-ignore
      const valueish = getComponentValue(component, index);
      if (valueish) {
        entity[component.id] = parseValue(component, valueish.value);
      }
    });
    return entity;
  }

  return {
    accounts: accounts(world, components),
    addresses: addresses(world, components),
    auctions: auctions(world, components),
    configs: configs(world, components),
    data: data(world, components),
    factions: factions(world, components),
    kamis: kamis(world, components),
    goals: goals(world, components),
    items: items(world, components),
    nodes: nodes(world, components),
    npc: npcs(world, components),
    quests: quests(world, components),
    recipes: recipes(world, components),
    rooms: rooms(world, components),
    skills: skills(world, components),
    traits: traits(world, components),

    // helper function to get all the set components values for a given entity
    entities: {
      get: (index: EntityIndex) => {
        return getEntity(index);
      },
      getByID: (id: EntityID) => {
        const index = world.entityToIndex.get(id);
        if (index) return getEntity(index);
      },
    },
  };
};
