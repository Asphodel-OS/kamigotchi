// src/layers/react/components/buttons/Wallet.tsx
import '@rainbow-me/rainbowkit/styles.css';
import { of } from 'rxjs';

import { registerUIComponent } from 'layers/react/engine/store';
import { AccountButton } from './CustomRainbowButton';
import { PrivyButton } from './PrivyButton';

export function registerWalletFixture() {
  registerUIComponent(
    'WalletFixture',
    {
      colStart: 91,
      colEnd: 100,
      rowStart: 3,
      rowEnd: 12,
    },
    (layers) => of(layers),
    () => {
      return <PrivyButton />;
      return <AccountButton size='menu' />;
    }
  );
}
