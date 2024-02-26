import { FetchBalanceResult } from '@wagmi/core';
import { useEffect, useState } from 'react';
import { map, merge } from 'rxjs';
import styled from 'styled-components';
import { useBalance, useContractRead } from 'wagmi';

import { abi as Pet721ProxySystemABI } from 'abi/Pet721ProxySystem.json';
import { GasConstants } from 'constants/gas';
import {
  Account,
  calcStamina,
  calcStaminaPercent,
  getAccountFromBurner,
} from 'layers/network/shapes/Account';
import { getRoomByIndex } from 'layers/network/shapes/Room';
import { Battery } from 'layers/react/components/library/Battery';
import { Gauge } from 'layers/react/components/library/Gauge';
import { Tooltip } from 'layers/react/components/library/Tooltip';
import { registerUIComponent } from 'layers/react/engine/store';
import { useVisibility } from 'layers/react/store/visibility';

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
      const { network } = layers;
      const { Coin, RoomIndex, Name, OperatorAddress, Stamina } = network.components;

      return merge(
        Coin.update$,
        RoomIndex.update$,
        Name.update$,
        OperatorAddress.update$,
        Stamina.update$
      ).pipe(
        map(() => {
          const account = getAccountFromBurner(network);
          return {
            network,
            data: {
              account,
              room: getRoomByIndex(network, account.roomIndex),
            },
          };
        })
      );
    },
    ({ network, data }) => {
      // console.log('mAccountInfo:', data);
      const [lastRefresh, setLastRefresh] = useState(Date.now());
      const { account, room } = data;
      const { fixtures } = useVisibility();

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
        address: account.operatorEOA as `0x${string}`,
        watch: true,
      });

      // $KAMI Balance
      const { data: mint20Addy } = useContractRead({
        address: network.systems['system.Mint20.Proxy']?.address as `0x${string}`,
        abi: Pet721ProxySystemABI,
        functionName: 'getTokenAddy',
      });

      const { data: ownerKAMI } = useBalance({
        address: account.ownerEOA as `0x${string}`,
        token: mint20Addy as `0x${string}`,
        watch: true,
      });

      /////////////////
      // INTERPRETATION

      // calculated the gas gauge level
      const calcGaugeSetting = (gasBalance: FetchBalanceResult | undefined): number => {
        const amt = Number(gasBalance?.formatted);
        if (amt >= GasConstants.Full) return 100;
        if (amt <= GasConstants.Low) return 0;
        return (amt / GasConstants.Full) * 100;
      };

      // parses a wagmi FetchBalanceResult
      const parseBalanceResult = (bal: FetchBalanceResult | undefined, precision: number = 4) => {
        return Number(bal?.formatted ?? 0).toFixed(precision);
      };

      const parseStaminaString = (account: Account) => {
        const staminaCurr = calcStamina(account);
        const staminaTotal = account.stamina.total;
        return `${staminaCurr}/${staminaTotal * 1}`;
      };

      /////////////////
      // CONTENT

      const getStaminaTooltip = (account: Account) => {
        const staminaString = parseStaminaString(account);
        const recoveryPeriod = Math.round(1 / account.stamina.rate);
        return [
          `Account Stamina (${staminaString})`,
          '',
          `Determines how far your Operator can travel. Recovers every ${recoveryPeriod}s`,
        ];
      };

      const getKAMITooltip = () => {
        return [`$KAMI Balance`, '', `Use this to mint your party of Kamigotchi.`];
      };

      const getGasTooltip = () => {
        return [
          `Operator Gas`,
          '',
          `Your Operator won't function without this. Make sure to stay topped up for the journey!`,
        ];
      };

      const borderLeftStyle = { borderLeft: '.1vw solid black' };
      return (
        account && (
          <Container id='accountInfo' style={{ display: fixtures.accountInfo ? 'block' : 'none' }}>
            <Row>
              <TextBox>
                {account.name} - {room.name}
              </TextBox>
            </Row>
            <Line />
            <Row>
              <Cell>
                <Tooltip text={getStaminaTooltip(account)}>
                  <TextBox>
                    {`${calcStaminaPercent(account)}%`}
                    <Battery level={calcStaminaPercent(account)} />
                  </TextBox>
                </Tooltip>
              </Cell>
              <Cell style={borderLeftStyle}>
                <Tooltip text={getKAMITooltip()}>
                  <TextBox>$KAMI: {parseBalanceResult(ownerKAMI, 1)}</TextBox>
                </Tooltip>
              </Cell>
              <Cell style={borderLeftStyle}>
                <Tooltip text={getGasTooltip()}>
                  <TextBox>
                    Gas: {parseBalanceResult(operatorGas)}Ξ
                    <Gauge level={calcGaugeSetting(operatorGas)} />
                  </TextBox>
                </Tooltip>
              </Cell>
            </Row>
          </Container>
        )
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
  gap: 0.5vw;
  width: 33%;

  color: black;
  font-family: Pixel;
  font-size: 0.8vw;
`;

const Line = styled.div`
  border-top: 0.1vw solid black;
  width: 100%;
  height: 1px;
`;

const TextBox = styled.div`
  display: flex;
  flex-flow: row nowrap;
  justify-content: center;
  align-items: center;
  padding: 0.8vw 0vw;
  gap: 0.5vw;

  color: black;
  font-family: Pixel;
  font-size: 0.8vw;
`;
