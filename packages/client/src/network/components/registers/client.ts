import { World } from '@mud-classic/recs';
import { defineDescriptorComponent, defineLoadingStateComponent } from '../definitions';

// define functions for registration
export function createClientComponents(world: World) {
  return {
    For: defineDescriptorComponent(world, 'For', 'local.component.for'),
    LoadingState: defineLoadingStateComponent(world),
  };
}
