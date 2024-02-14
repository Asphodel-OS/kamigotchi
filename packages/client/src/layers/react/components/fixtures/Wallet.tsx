// src/layers/react/components/buttons/Wallet.tsx
import '@rainbow-me/rainbowkit/styles.css';
import { AccountButton } from 'layers/react/components/library/CustomRainbowButton';
import { of } from 'rxjs';

import { registerUIComponent } from 'layers/react/engine/store';

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
      return <AccountButton size='menu' />;
    }
  );
}
