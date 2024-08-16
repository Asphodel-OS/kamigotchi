import { interval, map } from 'rxjs';
import styled from 'styled-components';

import { Battery, Tooltip } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { useVisibility } from 'app/stores';
import { ItemImages } from 'assets/images/items';

import { calcStaminaPercent, getAccountEntityFromBurner, getStamina } from 'network/shapes/Account';
import { getMusuBalance } from 'network/shapes/Item';
import { Stat } from 'network/shapes/Stats';
import { getCurrPhase, getKamiTime, getPhaseIcon, getPhaseName } from 'utils/time';

export function registerAccountHeader() {
  registerUIComponent(
    'HeaderFixture',
    {
      colStart: 33,
      colEnd: 67,
      rowStart: 3,
      rowEnd: 30,
    },
    (layers) => {
      return interval(1000).pipe(
        map(() => {
          const { network } = layers;
          const { world, components } = network;
          const accountEntity = getAccountEntityFromBurner(network);

          return {
            data: {
              stamina: getStamina(world, components, accountEntity),
              musu: getMusuBalance(world, components, world.entities[accountEntity]),
            },
          };
        })
      );
    },
    ({ data }) => {
      const { stamina, musu } = data;
      const { fixtures } = useVisibility();

      /////////////////
      // INTERPRETATION

      const getStaminaTooltip = (stamina: Stat) => {
        const staminaCurr = stamina.sync;
        const staminaTotal = stamina.total;
        const staminaString = `${staminaCurr}/${staminaTotal * 1}`;
        const recoveryPeriod = Math.round(1 / stamina.rate);
        return [
          `Account Stamina (${staminaString})`,
          '',
          `Determines how far your Operator can travel. Recovers by 1 every ${recoveryPeriod}s`,
        ];
      };

      const getClockTooltip = () => {
        const phase = getPhaseName(getCurrPhase());
        return [
          `Kami World Clock (${phase})`,
          '',
          `Kamigotchi World operates on a 36h day with three distinct phases: Daylight, Evenfall, and Moonside.`,
        ];
      };

      const getMusuTooltip = () => {
        return [
          'Musubi (musu)',
          '',
          'The interconnecting energy of the universe. Collect it by Harvesting with your Kamis.',
        ];
      };

      return (
        <Container id='header' style={{ display: fixtures.header ? 'block' : 'none' }}>
          <Row>
            <Cell>
              <Tooltip text={getStaminaTooltip(stamina)}>
                <TextBox>
                  {`${calcStaminaPercent(stamina)}%`}
                  <Battery level={calcStaminaPercent(stamina)} />
                </TextBox>
              </Tooltip>
            </Cell>
            <Cell>
              <Tooltip text={getClockTooltip()}>
                <TextBox>
                  <Icon src={getPhaseIcon(getCurrPhase())} />
                  {getKamiTime(Date.now())}
                </TextBox>
              </Tooltip>
            </Cell>
            <Cell style={{ borderWidth: 0 }}>
              <Tooltip text={getMusuTooltip()}>
                <TextBox>
                  <Icon src={ItemImages.musu} />
                  {musu}
                </TextBox>
              </Tooltip>
            </Cell>
          </Row>
        </Container>
      );
    }
  );
}

const Container = styled.div`
  background-color: white;
  border: 0.15vw solid black;
  border-radius: 0.6vw;
  width: 99%;
  height: 4.5vh;

  display: flex;
  flex-flow: column nowrap;
  justify-content: space-around;
  align-items: center;

  pointer-events: auto;
`;

const Row = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-evenly;

  flex-grow: 1;
`;

const Cell = styled.div`
  border-right: 0.15vw solid black;
  width: 33%;

  display: flex;
  flex-flow: row nowrap;
  justify-content: center;
  align-items: center;
`;

const TextBox = styled.div`
  padding: 1.2vh;

  display: flex;
  flex-flow: row nowrap;
  justify-content: center;
  align-items: center;
  gap: 0.6vh;

  color: black;
  font-family: Pixel;
  font-size: 1.2vh;
`;

const Icon = styled.img`
  width: 2.4vh;
  height: auto;
`;
