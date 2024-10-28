import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import { interval, map } from 'rxjs';
import styled from 'styled-components';

import { Tooltip } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { useVisibility } from 'app/stores';
import { ItemImages } from 'assets/images/items';

import { getColor } from 'app/components/library/base/measures/Battery';
import { calcStaminaPercent, getStamina, queryAccountFromBurner } from 'network/shapes/Account';
import { getMusuBalance } from 'network/shapes/Item';
import { Stat } from 'network/shapes/Stats';
import { getCurrPhase, getPhaseIcon, getPhaseName } from 'utils/time';

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
          const accountEntity = queryAccountFromBurner(network);

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
        //  {getKamiTime(Date.now())}
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
        <Container>
          <Tooltip text={getMusuTooltip()}>
            <TextBox>
              <Icon src={ItemImages.musu} />
              {musu}
            </TextBox>
          </Tooltip>
          <Circle>
            <Tooltip text={getClockTooltip()}>
              <Phases>
                <Icon
                  style={{
                    position: 'relative',
                    right: '3vh',
                    top: '6vh',
                  }}
                  src={getPhaseIcon((getCurrPhase() + 1) % 3)}
                />
                <Icon
                  style={{
                    position: 'relative',
                    top: '1vh',
                  }}
                  src={getPhaseIcon(getCurrPhase())}
                />
                <Icon
                  style={{
                    position: 'relative',
                    left: '3vh',
                    top: '6vh',
                  }}
                  src={getPhaseIcon((getCurrPhase() + 2) % 3)}
                />
              </Phases>
            </Tooltip>
            <ArrowUpwardIcon
              style={{ width: '5vh', height: '6vh', top: '1.6vh', position: 'relative' }}
            />
            <SmallCircle>
              <SmallCircleFill height={calcStaminaPercent(stamina)}>
                <Tooltip text={getStaminaTooltip(stamina)}>
                  <CircleTextBox style={{ height: 100 }} />
                </Tooltip>
              </SmallCircleFill>
            </SmallCircle>
          </Circle>
        </Container>
      );
    }
  );
}

const Container = styled.div`
  pointer-events: auto;
  position: absolute;
  bottom: 10;
  left: 10;
`;

const TextBox = styled.div`
  height: 4.5vh;
  width: max-content;
  padding: 1.2vh;

  display: flex;
  flex-flow: row nowrap;
  justify-content: center;
  align-items: center;
  gap: 0.6vh;

  color: black;
  font-family: Pixel;
  background-color: white;
  border: 0.15vw solid black;
  font-size: 1.2vh;
  border-radius: 0.9vh;
  left: 13vh;
  top: 2.5vh;
  position: relative;
`;

const Icon = styled.img`
  width: 2.4vh;
  height: auto;
`;

const Circle = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  border-radius: 50%;
  height: 15vh;
  width: 15vh;
  border: 0.2vh solid black;
  background-color: white;
  position: relative;
`;
const SmallCircle = styled.div`
  border-radius: 50%;
  height: 8vh;
  width: 8vh;
  border: 0.3vh solid black;
  position: relative;

  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  overflow: hidden;
`;
const SmallCircleFill = styled.div<{ height: number }>`
  height: ${({ height }) => height}%;
  position: relative;
  background-color: ${({ height }) => getColor(height)};
`;
const Phases = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`;
const CircleTextBox = styled.div`
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
