import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';
import styled from 'styled-components';

import { Tooltip } from 'app/components/library';
import { getColor } from 'app/components/library/base/measures/Battery';
import { registerUIComponent } from 'app/root';
import { useVisibility } from 'app/stores';
import { ClockIcons } from 'assets/images/icons/clock';
import { calcStaminaPercent, getStamina, queryAccountFromBurner } from 'network/shapes/Account';
import { Stat } from 'network/shapes/Stats';
import { getCurrPhase, getKamiTime, getPhaseName } from 'utils/time';

export function registerClock() {
  registerUIComponent(
    'ClockFixture',
    {
      colStart: 33,
      colEnd: 67,
      rowStart: 78,
      rowEnd: 99,
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
            },
          };
        })
      );
    },
    ({ data }) => {
      const { stamina } = data;
      const { fixtures } = useVisibility();
      const [rotateClock, setRotateClock] = useState(0);
      const [rotateBand, setRotateBand] = useState(0);

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
          `Kami World Clock (${phase}): ${getKamiTime(Date.now())}`,
          '',
          `Kamigotchi World operates on a 36h day with three distinct phases: Daylight, Evenfall, and Moonside.`,
        ];
      };

      function updateClocks() {
        const kamiTime = parseInt(getKamiTime(Date.now()).split(':')[0]);
        setRotateClock((kamiTime - 18) * 10);
        //day, twilight, night
        setRotateBand([60, 300, 180][Math.floor(kamiTime / 12)]);
      }

      useEffect(() => {
        updateClocks();
        const interval = setInterval(updateClocks, 1000);
        return () => clearInterval(interval);
      }, []);

      return (
        <Container style={{ display: fixtures.menu ? 'flex' : 'none' }}>
          <Circle rotation={rotateClock}>
            <BandColor rotation={rotateBand} />
            <Tooltip text={getClockTooltip()}>
              <Phases>
                <IconNight src={ClockIcons.night} iconColor={rotateBand} rotation={rotateClock} />
                <IconTwilight
                  src={ClockIcons.twilight}
                  iconColor={rotateBand}
                  rotation={rotateClock}
                />
                <IconDay src={ClockIcons.day} iconColor={rotateBand} rotation={rotateClock} />
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
  left: 4;
  z-index: -1;
`;

const Circle = styled.div<{ rotation: number }>`
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  border-radius: 50%;
  height: 25vh;
  width: 25vh;
  position: absolute;
  background-image: url(${ClockIcons.clock_base});
  background-position: center;
  background-repeat: no-repeat;
  background-size: 17.5vh;
  z-index: -1;
  overflow: hidden;
  transform-origin: center;
  ${({ rotation }) => `transform: rotate(${rotation}deg);`}
`;

const ClockOverlay = styled.div`
  background-image: url(${ClockIcons.overlay});
  background-position: center;
  background-size: 20vh;
  background-repeat: no-repeat;
  height: 18.5vh;
  width: 20vh;
  pointer-events: none;
  position: absolute;
  left: 1.5vh;
  top: 2.5vh;
`;

const SmallCircle = styled.div`
  border-radius: 50%;
  height: 7vh;
  width: 7vh;
  border: 0.3vh solid black;
  position: absolute;
  top: 11.5vh;
  left: 9vh;
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

const BandColor = styled.div<{ rotation: number }>`
  min-width: 60%;
  min-height: 60%;
  top: 5vh;
  position: absolute;
  border-width: 0.3vh;
  --a: 120deg;
  aspect-ratio: 1;
  padding: 0.8vh;
  box-sizing: border-box;
  border-radius: 50%;
  ${({ rotation }) => `transform: rotate(${rotation}deg);`}
  ${({ rotation }) =>
    rotation === 180
      ? `background: rgb(79 34 183 / 42%);`
      : rotation === 60
        ? `background: rgb(191 180 27 / 42%);`
        : `background: rgb(174 18 191 / 42%);`}
  mask:
    linear-gradient(#0000 0 0) content-box intersect,
    conic-gradient(#000 var(--a), #0000 0);
`;

const IconNight = styled.img<{ iconColor: number; rotation: number }>`
  position: relative;
  left: -0.2vh;
  bottom: 1.8vh;
  width: 3.3vh;
  ${({ iconColor }) => iconColor === 180 && `filter:opacity(0.75) drop-shadow(0 0 0 #4f22b7);`}
  ${({ rotation }) => `transform: rotate(${-rotation}deg);`}
`;

const IconTwilight = styled.img<{ iconColor: number; rotation: number }>`
  position: relative;
  left: 1.5vh;
  bottom: 10.8vh;
  width: 3.3vh;
  ${({ iconColor }) => iconColor === 300 && `filter:opacity(0.75) drop-shadow(0 0 0 #ae12bf);`}
  ${({ rotation }) => `transform: rotate(${-rotation}deg);`}
`;

const IconDay = styled.img<{ iconColor: number; rotation: number }>`
  position: relative;
  left: 3.2vh;
  bottom: 1.8vh;
  width: 3.3vh;
  ${({ iconColor }) => iconColor === 60 && `filter:opacity(0.75) drop-shadow(0 0 0 #bfb41b);`}
  ${({ rotation }) => `transform: rotate(${-rotation}deg);`}
`;
