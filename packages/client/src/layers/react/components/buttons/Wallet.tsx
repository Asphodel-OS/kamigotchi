// src/layers/react/components/buttons/Wallet.tsx
import React from 'react';
import { of } from 'rxjs';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import "@rainbow-me/rainbowkit/styles.css";

import { registerUIComponent } from 'layers/react/engine/store';

export function registerWalletButton() {
  registerUIComponent(
    'WalletButton',
    {
      colStart: 80,
      colEnd: 99,
      rowStart: 10,
      rowEnd: 20,
    },
    (layers) => of(layers),
    () => {
      return (
        <div style={{ pointerEvents: "all" }}>
          <ConnectButton
            label="Connect Wallet"
            showBalance={false}
          />
        </div>
      );
    },
  );
}
