// src/layers/react/components/buttons/Wallet.tsx
import React from 'react';
import { of } from 'rxjs';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import "@rainbow-me/rainbowkit/styles.css";

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
      return (
        <div style={{ pointerEvents: "all" }}>
          <ConnectButton
            label="Connect Wallet"
            showBalance={false}
            chainStatus="none"
            accountStatus="address"
          />
        </div>
      );
    },
  );
}
