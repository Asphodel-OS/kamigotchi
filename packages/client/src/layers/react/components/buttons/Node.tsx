import React from 'react';
import { of } from 'rxjs';

import { MenuButton } from 'layers/react/components/library/MenuButton';
import { registerUIComponent } from 'layers/react/engine/store';
import { dataStore } from 'layers/react/store/createStore';

export function registerNodeButton() {
  registerUIComponent(
    'NodeButton',
    {
      colStart: 88,
      colEnd: 100,
      rowStart: 60,
      rowEnd: 70,
    },
    (layers) => of(layers),
    () => {
      const {
        visibleModals: { nodeButton },
      } = dataStore();
      return (
        <MenuButton id='node_button' targetDiv='node' visible={nodeButton}>
          Node
        </MenuButton>
      );
    }
  );
}
