import { interval, map } from 'rxjs';
import styled from 'styled-components';
import { erc20Abi, formatEther, formatUnits } from 'viem';
import { useBalance, useReadContract, useReadContracts, useWatchBlockNumber } from 'wagmi';

import { abi as Mint20ProxySystemABI } from 'abi/Mint20ProxySystem.json';
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
import { useVisibility } from 'layers/react/store';

export function registerHeaderFixture() {
  registerUIComponent(
    'HeaderFixture',
    {
      colStart: 33,
      colEnd: 67,
      rowStart: 3,
      rowEnd: 30,
    },
    (layers) => {
      const { network } = layers;
      const { world, components } = network;

      return interval(1000).pipe(
        map(() => {
          const account = getAccountFromBurner(network);
          return {
            network,
            data: {
              account,
              room: getRoomByIndex(world, components, account.roomIndex),
            },
          };
        })
      );
    },
    ({ network, data }) => {
      // console.log('mAccountInfo:', data);
      const { account, room } = data;
      const { fixtures } = useVisibility();

      /////////////////
      // SUBSCRIPTIONS

      useWatchBlockNumber({
        onBlockNumber: (n) => {
          refetchMint20Addy();
          refetchOwnerMint20Balance();
          refetchOperatorEthBalance();
        },
      });

      // Operator Eth Balance
      const { data: operatorEthBalance, refetch: refetchOperatorEthBalance } = useBalance({
        address: account.operatorEOA as `0x${string}`,
      });

      // $KAMI Contract Address
      const { data: mint20Addy, refetch: refetchMint20Addy } = useReadContract({
        address: network.systems['system.Mint20.Proxy']?.address as `0x${string}`,
        abi: Mint20ProxySystemABI,
        functionName: 'getTokenAddy',
      });

      // $KAMI Balance
      const { data: ownerMint20Balance, refetch: refetchOwnerMint20Balance } = useReadContracts({
        contracts: [
          {
            abi: erc20Abi,
            address: mint20Addy as `0x${string}`,
            functionName: 'balanceOf',
            args: [account.ownerEOA as `0x${string}`],
          },
          {
            abi: erc20Abi,
            address: mint20Addy as `0x${string}`,
            functionName: 'decimals',
          },
        ],
      });

      /////////////////
      // INTERPRETATION

      // calculated the gas gauge level
      const calcGaugeSetting = (balance: bigint = BigInt(0)): number => {
        const formatted = Number(formatEther(balance));
        const level = formatted / GasConstants.Full;
        return 100 * Math.min(level, 1.0);
      };

      // parses a wagmi FetchBalanceResult
      const parseTokenBalance = (
        balance: bigint = BigInt(0),
        decimals: number = 18,
        precision: number = 3
      ) => {
        const formatted = formatUnits(balance, decimals);
        return Number(formatted).toFixed(precision);
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
          <Container id='header' style={{ display: fixtures.header ? 'block' : 'none' }}>
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
                  <TextBox>
                    $KAMI:{' '}
                    {parseTokenBalance(
                      ownerMint20Balance?.[0]?.result,
                      ownerMint20Balance?.[1]?.result
                    )}
                  </TextBox>
                </Tooltip>
              </Cell>
              <Cell style={borderLeftStyle}>
                <Tooltip text={getGasTooltip()}>
                  <TextBox>
                    Gas:{' '}
                    {parseTokenBalance(operatorEthBalance?.value, operatorEthBalance?.decimals)}Ξ
                    <Gauge level={calcGaugeSetting(operatorEthBalance?.value)} />
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
