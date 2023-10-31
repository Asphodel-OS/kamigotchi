import React, { useEffect, useState } from 'react';
import { map, merge } from 'rxjs';
import { useContractRead, useBalance } from 'wagmi';
import styled from 'styled-components';
import { GasConstants } from 'constants/gas';

import { abi as Pet721ProxySystemABI } from "abi/Pet721ProxySystem.json"
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
      const [operatorBal, setOperatorBal] = useState(0);
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

      const { data: rawOperatorBal } = useBalance({
        address: data.account.operatorEOA as `0x${string}`,
        watch: true
      });

      useEffect(() => {
        const bal = Number(rawOperatorBal?.formatted).toFixed(4);
        setOperatorBal(Number(bal));
      }, [rawOperatorBal]);

      // $KAMI Balance
      const { data: mint20Addy } = useContractRead({
        address: layers.network.systems["system.Mint20.Proxy"].address as `0x${string}`,
        abi: Pet721ProxySystemABI,
        functionName: 'getTokenAddy'
      });

      const { data: accountMint20Bal } = useBalance({
        address: data.account.ownerEOA as `0x${string}`,
        token: mint20Addy as `0x${string}`,
        watch: true
      });



      /////////////////
      // CALCULATIONS

      const calcOperatorGauge = (): number => {
        if (Number(rawOperatorBal?.formatted) >= GasConstants.Full) return 100;
        if (Number(rawOperatorBal?.formatted) <= GasConstants.Low) return 0;
        return Number(rawOperatorBal?.formatted) / GasConstants.Full * 100;
      }


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

      return (data.account &&
        <Container
          id='accountInfo'
          style={{ display: visibleButtons.accountInfo ? 'block' : 'none' }}
        >
          <Row>
            <NameCell>{data.account.name}</NameCell>
            <GaugeCell>
              <Text>Gas: {operatorBal}Ξ</Text>
              <Gauge level={calcOperatorGauge()} />
            </GaugeCell>
          </Row>
          <Line />
          <Row>
            <BatteryCell>
              {`${calcStaminaPercent(data.account)}%`}
              <Tooltip text={[calcStaminaPercent(data.account).toString()]}>
                <Battery level={calcStaminaPercent(data.account)} />
              </Tooltip>
            </BatteryCell>
            <WordCell>$KAMI: {Number(accountMint20Bal?.formatted ?? 0) ?? '???'}</WordCell>
            <WordCell>$MUSU: {1 * (data.account.coin ?? 0)}</WordCell>
          </Row>
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
  width: 99%;
  padding: 0.2vw 0vw;

  display: flex;
  flex-flow: column nowrap;
  justify-content: space-around;
  align-items: center;
`;

const Row = styled.div`
  width: 100%;
  padding: 0.6vw 0vw;
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-around;
`;

const Line = styled.div`
  border-top: .1vw solid black;
  width: 100%;
  height: 1px;
`;

const Text = styled.p`
  color: black;
  font-family: Pixel;
  font-size: 0.8vw;

  padding: 0 0.5vw 0 0 ;
`;

const BatteryCell = styled.div`
  display: flex;
  flex-grow: 1;
  flex-flow: row nowrap;
  justify-content: center;
  align-items: center;

  color: black;
  font-family: Pixel;
  font-size: 0.8vw;
`;

const NameCell = styled.div`
  display: flex;
  flex-grow: 3;
  justify-content: center;
  align-items: center;

  color: black;
  font-family: Pixel;
  font-size: 0.8vw;
`;

const GaugeCell = styled.div`
  display: flex;
  flex-grow: 1;
  flex-flow: row nowrap;
  justify-content: center;
  align-items: center;

  color: black;
  font-family: Pixel;
  font-size: 0.8vw;
  border-left: 0.1vw solid black;
`;

const WordCell = styled.div`
  border-left: 0.1vw solid black;
  
  display: flex;
  flex-grow: 1;
  justify-content: center;
  align-items: center;

  color: black;
  font-family: Pixel;
  font-size: 0.8vw;
`;
