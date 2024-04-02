// src/layers/react/components/buttons/Wallet.tsx
import { of } from 'rxjs';

import { registerUIComponent } from 'layers/react/engine/store';
import { PrivyButton } from './PrivyButton';

// this doesn't need to be abstracted into such a lightweight component
// but doing so enables local hot reloading on component changes
export function registerLoginFixture() {
  registerUIComponent(
    'LoginFixture',
    {
      colStart: 91,
      colEnd: 100,
      rowStart: 3,
      rowEnd: 12,
    },
    (layers) => of(layers),
    () => {
      return <PrivyButton />;
    }
  );
}
