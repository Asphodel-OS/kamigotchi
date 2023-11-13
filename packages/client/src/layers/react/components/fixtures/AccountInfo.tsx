import React, { useEffect, useState } from 'react';
import { map, merge } from 'rxjs';
import { useContractRead, useBalance } from 'wagmi';
import { FetchBalanceResult } from '@wagmi/core';
import styled from 'styled-components';

import { abi as Pet721ProxySystemABI } from "abi/Pet721ProxySystem.json"
import { GasConstants } from 'constants/gas';
import { Account, getAccountFromBurner } from 'layers/react/shapes/Account';
import { registerUIComponent } from 'layers/react/engine/store';
import { Tooltip } from 'layers/react/components/library/Tooltip';
import { Battery } from 'layers/react/components/library/Battery';
import { Gauge } from 'layers/react/components/library/Gauge';
import { dataStore } from 'layers/react/store/createStore';

export function registerAccountInfoFixture() {
  registerUIComponent(
    'AccountInfo',
    {
      colStart: 33,
      colEnd: 67,
      rowStart: 3,
      rowEnd: 30,
    },
    (layers) => {
      const {
        network: {
          components: {
            Coin,
            Name,
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
          return {
            layers,
            data: { account: getAccountFromBurner(layers) },
          };
        })
      );
    },
    ({ layers, data }) => {
      // console.log('mAccountInfo:', data);
      const [lastRefresh, setLastRefresh] = useState(Date.now());
      const { visibleButtons } = dataStore();

      /////////////////
      // TRACKING

      // Ticking
      useEffect(() => {
        const refreshClock = () => {
          setLastRefresh(Date.now());
        };
        const timerId = setInterval(refreshClock, 1000);
        return function cleanup() {
          clearInterval(timerId);
        };
      }, []);

      // Operator Balance
      const { data: operatorGas } = useBalance({
        address: data.account.operatorEOA as `0x${string}`,
        watch: true
      });

      // $KAMI Balance
      const { data: mint20Addy } = useContractRead({
        address: layers.network.systems["system.Mint20.Proxy"].address as `0x${string}`,
        abi: Pet721ProxySystemABI,
        functionName: 'getTokenAddy'
      });

      const { data: ownerKAMI } = useBalance({
        address: data.account.ownerEOA as `0x${string}`,
        token: mint20Addy as `0x${string}`,
        watch: true
      });


      /////////////////
      // INTERPRETATION

      const calcCurrentStamina = (account: Account) => {
        const timePassed = lastRefresh / 1000 - account.lastMoveTs;
        const recovered = Math.floor(timePassed / account.stamina.recoveryPeriod);
        const current = 1.0 * account.stamina.last + recovered;
        return Math.min(account.stamina.total, current);
      }

      const calcStaminaPercent = (account: Account) => {
        const currentStamina = calcCurrentStamina(account);
        return Math.round(100.0 * currentStamina / account.stamina.total);
      }

      // calculated the gas gauge level
      const calcGaugeSetting = (gasBalance: FetchBalanceResult | undefined): number => {
        const amt = Number(gasBalance?.formatted);
        if (amt >= GasConstants.Full) return 100;
        if (amt <= GasConstants.Low) return 0;
        return amt / GasConstants.Full * 100;
      }

      // parses a wagmi FetchBalanceResult 
      const parseBalanceResult = (
        bal: FetchBalanceResult | undefined,
        precision: number = 4
      ) => {
        return Number(bal?.formatted ?? 0).toFixed(precision);
      }

      const borderLeftStyle = { borderLeft: '.1vw solid black' };
      return (data.account &&
        <Container
          id='accountInfo'
          style={{ display: visibleButtons.accountInfo ? 'block' : 'none' }}
        >
          <Row>
            <Cell>{data.account.name} - {data.account.location}</Cell>
          </Row>
          <Line />
          <Row>
            <Cell>
              {`${calcStaminaPercent(data.account)}%`}
              <Battery level={calcStaminaPercent(data.account)} />
            </Cell>
            <Cell style={borderLeftStyle}>$KAMI: {parseBalanceResult(ownerKAMI, 1)}</Cell>
            <Cell style={borderLeftStyle}>
              <Text>Gas: {parseBalanceResult(operatorGas)}Ξ</Text>
              <Gauge level={calcGaugeSetting(operatorGas)} />
            </Cell>
          </Row>
        </Container>
      );
    }
  );
}

const Container = styled.div`
  pointer-events: auto;
  border-color: black;
  border-width: 2px;
  border-radius: 10px;
  border-style: solid;
  background-color: white;
  &:active {
    background-color: #ddd;
  }
  width: 99%;
  padding: 0.2vw 0vw;

  display: flex;
  flex-flow: column nowrap;
  justify-content: space-around;
  align-items: center;
`;

const Row = styled.div`
  width: 100%;
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-evenly;
`;

const Cell = styled.div`
  display: flex;
  flex-flow: row nowrap;
  justify-content: center;
  align-items: center;
  padding: 0.8vw 0vw;
  gap: 0.5vw;
  width: 33%;

  color: black;
  font-family: Pixel;
  font-size: 0.8vw;
`;

const Line = styled.div`
  border-top: .1vw solid black;
  width: 100%;
  height: 1px;
`;

const Text = styled.div`
  color: black;
  font-family: Pixel;
  font-size: 0.8vw;
`;