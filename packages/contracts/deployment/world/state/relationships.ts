////////////////////
// RELATIONSHIPS

import { AdminAPI } from '../api';

export async function initRelationships(api: AdminAPI) {
  //        /->8->9-\
  // 1->2->3->4->5--->10
  //        \->6->7-/
  // top and bottom paths are mutually exclusive
  await api.registry.relationship.create(1, 1, 'mina 1', [], []);
  await api.registry.relationship.create(1, 2, 'mina 2', [1], []);
  await api.registry.relationship.create(1, 3, 'mina 3', [2], []);
  await api.registry.relationship.create(1, 4, 'mina 4', [3], []);
  await api.registry.relationship.create(1, 5, 'mina 5', [4], []);
  await api.registry.relationship.create(1, 6, 'mina 6', [3], [8]);
  await api.registry.relationship.create(1, 7, 'mina 7', [6], [8]);
  await api.registry.relationship.create(1, 8, 'mina 8', [3], [6]);
  await api.registry.relationship.create(1, 9, 'mina 9', [8], [6]);
  await api.registry.relationship.create(1, 10, 'mina 10', [5, 7, 9], []);
}

export async function deleteRelationships(api: AdminAPI, npcs: number[], indices: number[]) {
  for (let i = 0; i < indices.length; i++) {
    try {
      await api.registry.relationship.delete(npcs[i], indices[i]);
    } catch {
      console.error('Could not delete relationship ' + indices[i] + ' for npc ' + npcs[i]);
    }
  }
}
