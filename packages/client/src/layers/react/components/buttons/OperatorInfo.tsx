import { Has, HasValue, runQuery } from '@latticexyz/recs';
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
      rowEnd: 10,
    },
    (layers) => {
      const {
        network: {
          network: { connectedAddress },
          components: { IsAccount, OperatorAddress, StaminaCurrent },
        },
      } = layers;
      return merge(StaminaCurrent.update$).pipe(
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

          const { stamina: maxStamina, staminaCurrent, coin } = account;
          return {
            staminaCurrent,
            maxStamina,
            coin,
          };
        })
      );
    },
    ({ staminaCurrent, maxStamina, coin }) => {
      const operatorStaminaPercentage =
        staminaCurrent * 1 == 0 ? 0 : ((staminaCurrent * 1) / (maxStamina * 1)) * 100;

      return (
        <Button id='battery_button'>
          {staminaCurrent && (
            <>
              <TopDescription>$KAMI: {coin ? coin * 1 : 0}</TopDescription>
              <Centered>
                <BatteryComponent level={operatorStaminaPercentage} />
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
  padding-left: 10px;
  &:active {
    background-color: #c4c4c4;
  }
`;

const Centered = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
`;

const TopDescription = styled.p`
  font-size: 8px;
  color: #333;
  text-align: left;
  font-family: Pixel;
  grid-column: 1;
  align-self: center;
  border-style: solid;
  border-width: 2px;
  border-color: black;
  border-radius: 5px;
  padding: 5px;
`;
