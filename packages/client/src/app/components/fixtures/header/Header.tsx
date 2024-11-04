import { interval, map } from 'rxjs';
import styled from 'styled-components';

import { Tooltip } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { useVisibility } from 'app/stores';

import { getColor } from 'app/components/library/base/measures/Battery';
import { ClockIcons } from 'assets/images/icons/clock';
import { calcStaminaPercent, getStamina, queryAccountFromBurner } from 'network/shapes/Account';
import { getMusuBalance } from 'network/shapes/Item';
import { Stat } from 'network/shapes/Stats';
import { getCurrPhase, getPhaseName } from 'utils/time';

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
      /*
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
            </Tooltip>*/

      /*
             <Tooltip text={getMusuTooltip()}>
            <TextBox>
              <Icon src={ItemImages.musu} />
              {musu}
            </TextBox>
          </Tooltip> 
          */
      return (
        <Container style={{ display: fixtures.menu ? 'flex' : 'none' }}>
          <Circle>
            <ClockOverlay />
            <Tooltip text={getStaminaTooltip(stamina)}>
              <SmallCircle>
                <SmallCircleFill height={calcStaminaPercent(stamina)} />
              </SmallCircle>
            </Tooltip>
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
  z-index: -1;
`;
const ClockOverlay = styled.div`
  background-image: url(${ClockIcons.overlay});
  background-position: center;
  background-size: contain;
  background-repeat: no-repeat;
  width: 100%;
  height: 100%;
  pointer-events: none;
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
  position: relative;
  background-image: url(${ClockIcons.clock_base});
  background-position: center;
  background-size: contain;
  background-repeat: no-repeat;
  z-index: -1;
`;
const SmallCircle = styled.div`
  border-radius: 50%;
  height: 5.5vh;
  width: 5.5vh;
  border: 0.3vh solid black;
  position: absolute;
  left: 5.3vh;
  bottom: 2.5vh;

  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  overflow: hidden;
  background-image: url(${ClockIcons.stamina_base});
  background-position: center;
  background-size: 150vh;
  background-repeat: no-repeat;
  z-index: -1;
  pointer-event: none;
`;
const SmallCircleFill = styled.div<{ height: number }>`
  height: ${({ height }) => height}%;
  position: relative;
  background-color: ${({ height }) => getColor(height)};
  pointer-event: none;
`;
const Phases = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`;
