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

export function registerOperatorHealthButton() {
  registerUIComponent(
    'OperatorHealth',
    {
      colStart: 2,
      colEnd: 93,
      rowStart: 2,
      rowEnd: 30,
    },
    (layers) => {
      const {
        network: {
          network: { connectedAddress },
          components: { IsAccount, OperatorAddress, StaminaCurrent, Name },
        },
      } = layers;
      return merge(StaminaCurrent.update$, Name.update$).pipe(
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
          const operatorName =
            getComponentValue(Name, accountEntityIndex)?.value ?? 'Operator Name';

          const account =
            accountEntityIndex !== undefined
              ? getAccount(layers, accountEntityIndex)
              : ({} as Account);

          const { stamina: maxStamina, staminaCurrent, coin } = account;
          return {
            staminaCurrent,
            maxStamina,
            coin,
            operatorName,
          };
        })
      );
    },
    ({ staminaCurrent, maxStamina, coin, operatorName }) => {
      const operatorStaminaPercentage =
        staminaCurrent * 1 == 0 ? 0 : ((staminaCurrent * 1) / (maxStamina * 1)) * 100;

      return (
        <Button id='battery_button'>
          {staminaCurrent && (
            <>
              <Centered>
                <NameCell>
                  <Text>{operatorName}</Text>
                </NameCell>
                <KamiCell>
                  <Text>$KAMI: {coin ? coin * 1 : 0}</Text>
                </KamiCell>
                <BatteryCell>
                  <BatteryComponent level={operatorStaminaPercentage} />
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
    background-color: #c4c4c4;
  }
`;

const Centered = styled.div`
  display: grid;
  height: 100%;
  column-gap: 6px;
  margin: 5px;
`;

const Text = styled.p`
  font-size: 12px;
  color: #333;
  font-family: Pixel;
`;

const BatteryCell = styled.div`
  grid-column: 3;
  grid-row: 2;
`;

const KamiCell = styled.div`
  grid-column: 1 / 2;
  grid-row: 2;
  align-self: center;
`;

const NameCell = styled.div`
  grid-column: 1 / 3;
  grid-row: 1;
`;
