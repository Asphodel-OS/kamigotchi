import { Has, HasValue, runQuery } from '@latticexyz/recs';
import React, { useEffect, useState } from 'react';
import { map, merge } from 'rxjs';
import styled from 'styled-components';

import { BatteryComponent } from 'layers/react/components/library/Battery';
import { Account, getAccount } from 'layers/react/components/shapes/Account';
import { registerUIComponent } from 'layers/react/engine/store';
import { dataStore } from 'layers/react/store/createStore';

export function registerOperatorInfoButton() {
  registerUIComponent(
    'OperatorInfo',
    {
      colStart: 34,
      colEnd: 68,
      rowStart: 3,
      rowEnd: 30,
    },
    (layers) => {
      const {
        network: {
          network: { connectedAddress },
          components: {
            Coin,
            Name,
            IsAccount,
            OperatorAddress,
            StaminaCurrent,
            Stamina,
          },
        },
      } = layers;
      return merge(
        Name.update$,
        Coin.update$,
        Stamina.update$,
        StaminaCurrent.update$,
      ).pipe(
        map(() => {
          // get the account entity of the controlling wallet
          const accountEntityIndex = Array.from(
            runQuery([
              Has(IsAccount),
              HasValue(OperatorAddress, {
                value: connectedAddress.get(),
              }),
            ])
          )[0];

          const account =
            accountEntityIndex !== undefined
              ? getAccount(layers, accountEntityIndex)
              : ({} as Account);

          return {
            data: { account },
          };
        })
      );
    },
    ({ data }) => {
      const {
        visibleButtons: { operatorInfo: isVisible },
      } = dataStore();
      const [lastRefresh, setLastRefresh] = useState(Date.now());

      // ticking
      useEffect(() => {
        const refreshClock = () => {
          setLastRefresh(Date.now());
        };
        const timerId = setInterval(refreshClock, 3000);
        return function cleanup() {
          clearInterval(timerId);
        };
      }, []);

      /////////////////
      // CALCULATIONS

      const calcCurrentStamina = (account: Account) => {
        const timePassed = lastRefresh / 1000 - account.lastMoveTs;
        const recovered = Math.floor(timePassed / account.staminaRecoveryPeriod);
        const total = 1.0 * account.staminaCurrent + recovered;
        return Math.min(account.stamina, total);
      }

      const calcStaminaPercent = (account: Account) => {
        const currentStamina = calcCurrentStamina(account);
        return Math.floor(100.0 * currentStamina / account.stamina);
      }

      return (
        <Button id='operator_info' style={{ display: isVisible ? 'block' : 'none' }}>
          {data.account && (
            <>
              <Centered>
                <NameCell>
                  <Text>{data.account.name}</Text>
                </NameCell>
                <KamiCell>
                  <Text>$KAMI: {1 * (data.account.coin ?? 0)}</Text>
                </KamiCell>
                <BatteryCell>
                  <BatteryComponent showPercentage={true} level={calcStaminaPercent(data.account)} />
                </BatteryCell>
              </Centered>
            </>
          )}
        </Button>
      );
    }
  );
}

const Button = styled.button`
  cursor: pointer;
  &:active {
    background-color: #ffffff;
  }
  border-color: black;
  border-width: 2px;
  border-radius: 10px;
  border-style: solid;
  background-color: white;
  width: 100%;

  display: flex;
  flex-flow: column nowrap;
  font-family: Pixel;
`;

const Centered = styled.div`
  display: grid;
  height: 100%;
  height: 100%;
  width: 100%;
`;

const Text = styled.p`
  font-size: 12px;
  color: #333;
  font-family: Pixel;
`;

const BatteryCell = styled.div`
  grid-column: 3;
  grid-row: 1;
  border-color: black;
  border-width: 0px 0px 0px 0px;
  border-style: solid;
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const KamiCell = styled.div`
  grid-column: 2;
  grid-row: 1;
  border-color: black;
  border-width: 0px 2px 0px 0px;
  border-style: solid;
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const NameCell = styled.div`
  grid-column: 1;
  grid-row: 1;
  border-color: black;
  border-width: 0px 2px 0px 0px;
  border-style: solid;
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;
