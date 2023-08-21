import { Has, HasValue, runQuery } from '@latticexyz/recs';
import React, { useEffect, useState } from 'react';
import { map, merge } from 'rxjs';
import styled from 'styled-components';

import { Account, getAccount } from 'layers/react/shapes/Account';
import { registerUIComponent } from 'layers/react/engine/store';
import { Tooltip } from 'layers/react/components/library/Tooltip';
import { Battery } from 'layers/react/components/library/Battery';

export function registerAccountInfoFixture() {
  registerUIComponent(
    'AccountInfo',
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
      const [lastRefresh, setLastRefresh] = useState(Date.now());

      // ticking
      useEffect(() => {
        const refreshClock = () => {
          setLastRefresh(Date.now());
        };
        const timerId = setInterval(refreshClock, 1000);
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
        return Math.round(100.0 * currentStamina / account.stamina);
      }

      return (data.account &&
        <Container id='operator_info'>
          <NameCell>{data.account.name}</NameCell>
          <KamiCell>$MUSU: {1 * (data.account.coin ?? 0)}</KamiCell>
          <BatteryCell>
            {`${calcStaminaPercent(data.account)}%`}
            <Tooltip text={[calcStaminaPercent(data.account).toString()]}>
              <Battery level={calcStaminaPercent(data.account)} />
            </Tooltip>
          </BatteryCell>
        </Container>
      );
    }
  );
}

const Container = styled.div`
  cursor: pointer;
  border-color: black;
  border-width: 2px;
  border-radius: 10px;
  border-style: solid;
  background-color: white;
  &:active {
    background-color: #ddd;
  }
  width: 100%;
  padding: 0.2vw;

  display: flex;
  flex-flow: row nowrap;
  justify-content: space-around;
`;

const BatteryCell = styled.div`
  color: black;

  display: flex;
  flex-grow: 1;
  flex-flow: row nowrap;
  justify-content: center;
  align-items: center;

  font-family: Pixel;
  font-size: 0.8vw;
`;

const KamiCell = styled.div`
  border-color: black;
  border-width: 0px 2px 0px 0px;
  border-style: solid;
  
  color: black;

  display: flex;
  flex-grow: 1;
  justify-content: center;
  align-items: center;

  font-family: Pixel;
  font-size: 0.8vw;
`;

const NameCell = styled.div`
  border-color: black;
  border-width: 0px 2px 0px 0px;
  border-style: solid;

  color: black;

  display: flex;
  flex-grow: 1;
  justify-content: center;
  align-items: center;

  font-family: Pixel;
  font-size: 0.8vw;
`;
