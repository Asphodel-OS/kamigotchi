import {
  Has,
  HasValue,
  getComponentValue,
  getComponentValueStrict,
  runQuery,
} from '@latticexyz/recs';
import { registerUIComponent } from 'layers/react/engine/store';
import { map, merge } from 'rxjs';
import { BatteryComponent } from '../library/Battery';
import styled from 'styled-components';
import { getAccount } from '../shapes/Account';
import { Account } from '../shapes/Account';
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

          const {
            name,
            coin,
            stamina: maxStamina,
            staminaCurrent,
            lastMoveTs,
          } = account;

          return {
            name,
            coin,
            maxStamina,
            staminaCurrent,
            lastMoveTs,
          };
        })
      );
    },
    ({ name, coin, staminaCurrent, maxStamina, lastMoveTs }) => {
      const staminaPercentage =
        staminaCurrent * 1 == 0 ? 0 : ((staminaCurrent * 1) / (maxStamina * 1)) * 100;
      const {
        visibleButtons: { operatorInfo },
      } = dataStore();
      return (
        <Button id='operator_info' style={{ display: operatorInfo ? 'block' : 'none' }}>
          {staminaCurrent && (
            <>
              <Centered>
                <NameCell>
                  <Text>{name}</Text>
                </NameCell>
                <KamiCell>
                  <Text>$KAMI: {coin ? coin * 1 : 0}</Text>
                </KamiCell>
                <BatteryCell>
                  <BatteryComponent showPercentage={true} level={Math.round(staminaPercentage)} />
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
