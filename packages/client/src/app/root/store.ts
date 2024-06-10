import { action, observable } from 'mobx';
import { Observable } from 'rxjs';

import { Layers } from 'network/';
import { GridConfiguration, UIComponent } from './types';

export const RootStore = observable({
  UIComponents: new Map<string, UIComponent>(),
});

export const registerUIComponent = action(
  <T>(
    id: string,
    gridConfig: GridConfiguration,
    requirement: (layers: Layers) => Observable<T>,
    Render: React.FC<NonNullable<T>>
  ) => {
    RootStore.UIComponents.set(id, {
      requirement,
      Render: Render as React.FC,
      gridConfig,
    });
  }
);
