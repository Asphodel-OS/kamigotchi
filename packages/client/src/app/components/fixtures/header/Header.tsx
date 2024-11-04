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
       */

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
            <Tooltip text={getClockTooltip()}>
              <Phases>
                <Icon
                  style={{
                    position: 'relative',
                    left: '1.3vh',
                    bottom: '2.2vh',
                    width: '3vh',
                  }}
                  src={ClockIcons.night}
                />
                <Icon
                  style={{
                    position: 'relative',
                    left: '2.8vh',
                    bottom: '10.2vh',
                    width: '3vh',
                  }}
                  src={ClockIcons.twilight}
                />
                <Icon
                  style={{
                    position: 'relative',
                    left: '4.5vh',
                    bottom: '2.2vh',
                    width: '3vh',
                  }}
                  src={ClockIcons.day}
                />
              </Phases>
            </Tooltip>
          </Circle>
          <ClockOverlay />
          <Tooltip text={getStaminaTooltip(stamina)}>
            <SmallCircle>
              <SmallCircleFill height={calcStaminaPercent(stamina)} />
            </SmallCircle>
          </Tooltip>
        </Container>
      );
    }
  );
}

const Container = styled.div`
  pointer-events: auto;
  position: absolute;
  left: 10;
  z-index: -1;
  bottom: 6vh;
`;
/**/
const Circle = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  border-radius: 50%;
  height: 25vh;
  width: 25vh;
  position: relative;
  background-image: url(${ClockIcons.clock_base});
  background-position: center;
  background-repeat: no-repeat;
  background-size: 17.5vh;
  z-index: -1;
  overflow: hidden;
  transform-origin: center;
  animation: rotate 23s linear infinite;
  @keyframes rotate {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;
const ClockOverlay = styled.div`
  background-image: url(${ClockIcons.overlay});
  background-position: center;
  background-size: 17vh;
  background-repeat: no-repeat;
  height: 18.5vh;
  width: 17vh;
  pointer-events: none;
  position: absolute;
  left: 16%;
  top: 14%;
}
`;

const SmallCircle = styled.div`
  border-radius: 50%;
  height: 6vh;
  width: 6vh;
  border: 0.3vh solid black;
  position: absolute;
  bottom: 26%;
  left: 41.5%;

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
  position: absolute;
  left: 6vh;
  bottom: 6vh;
`;

const Icon = styled.img``;
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
