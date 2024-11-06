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
import { useEffect, useState } from 'react';
import { getCurrPhase, getKamiTime, getPhaseName } from 'utils/time';

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
      const [rotateClock, setRotateClock] = useState(0);

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

      function updateClocks() {
        const kamiTime = parseInt(getKamiTime(Date.now()).split(':')[0]);
        setRotateClock((kamiTime - 18) * 10);
      }

      useEffect(() => {
        updateClocks();
        const interval = setInterval(updateClocks, 1000);
        return () => clearInterval(interval);
      }, []);
      //
      return (
        <Container style={{ display: fixtures.menu ? 'flex' : 'none' }}>
          <Circle style={{ transform: `rotate(${rotateClock}deg)` }}>
            <BandColor />
            <Tooltip text={getClockTooltip()}>
              <Phases>
                <Icon
                  style={{
                    left: '-0.2vh',
                    bottom: '1.8vh',
                    width: '3.3vh',
                    transform: `rotate(${-rotateClock}deg)`,
                  }}
                  src={ClockIcons.night}
                />
                <Icon
                  style={{
                    left: '1.5vh',
                    bottom: '10.8vh',
                    width: '3.3vh',
                    transform: `rotate(${-rotateClock}deg)`,
                  }}
                  src={ClockIcons.twilight}
                />
                <Icon
                  style={{
                    left: '3.2vh',
                    bottom: '1.8vh',
                    width: '3.3vh',
                    transform: `rotate(${-rotateClock}deg)`,
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
  left: 4;
  z-index: -1;
  top: 77.7vh;
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
  position: absolute;
  background-image: url(${ClockIcons.clock_base});
  background-position: center;
  background-repeat: no-repeat;
  background-size: 17.5vh;
  z-index: -1;
  overflow: hidden;
  transform-origin: center;
`;
const BandColor = styled.div`
  min-width: 75%;
  min-height: 105%;
  top: 5vh;
  position: absolute;
  border-radius: 50%;
  border-width: 0.6vh;
  border-style: solid;
  border-color: black #ffffff00 #ffffff00 #00000000;
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
}
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

const Icon = styled.img`
  position: relative;
`;
