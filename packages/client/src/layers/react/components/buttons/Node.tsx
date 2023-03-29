import React from 'react';
import { of } from 'rxjs';

import { MenuButton } from 'layers/react/components/library/MenuButton';
import { registerUIComponent } from 'layers/react/engine/store';

export function registerNodeButton() {
  registerUIComponent(
    'NodeButton',
    {
      colStart: 88,
      colEnd: 100,
      rowStart: 58,
      rowEnd: 62,
    },
    (layers) => of(layers),
    () => {
      return (
        <MenuButton id="node_button" targetDiv="node">
          Node
        </MenuButton>
      );
    }
  );
}