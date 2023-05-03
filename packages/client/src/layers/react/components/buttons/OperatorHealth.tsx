import { Has, HasValue, getComponentValue, runQuery } from '@latticexyz/recs';
import { registerUIComponent } from 'layers/react/engine/store';
import { map, merge } from 'rxjs';
import { BatteryComponent } from '../library/Battery';
import styled from 'styled-components';

export function registerOperatorHealthButton() {
  registerUIComponent(
    'OperatorHealth',
    {
      colStart: 86,
      colEnd: 96,
      rowStart: 2,
      rowEnd: 10,
    },
    (layers) => {
      const {
        network: {
          network: { connectedAddress },
          components: { IsAccount, OperatorAddress, Stamina, StaminaCurrent },
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
          const maxStamina = getComponentValue(Stamina, accountEntityIndex)?.value ?? 0;
          const stamina = getComponentValue(StaminaCurrent, accountEntityIndex)?.value ?? 0;

          return {
            stamina,
            maxStamina,
          };
        })
      );
    },
    ({ stamina, maxStamina }) => {
      const operatorStaminaPercentage =
        stamina * 1 == 0 ? 0 : ((stamina * 1) / (maxStamina * 1)) * 100;

      return (
        <Button id='battery_button'>
          {stamina && (
            <Centered>
              <BatteryComponent level={operatorStaminaPercentage} />
            </Centered>
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
