import { useEffect, useLayoutEffect, useState } from 'react';
import { interval, map } from 'rxjs';
import styled from 'styled-components';

import { Account, calcCurrentStamina, getAccount } from 'app/cache/account';
import { Tooltip } from 'app/components/library';
import { getColor } from 'app/components/library/base/measures/Battery';
import { registerUIComponent } from 'app/root';
import { useVisibility } from 'app/stores';
import { ClockIcons } from 'assets/images/icons/clock';
import { queryAccountFromEmbedded } from 'network/shapes/Account';
import { calcPercent } from 'utils/math';
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
          const accountEntity = queryAccountFromEmbedded(network);
          const accountOptions = { config: 3600, live: 2 };

          return {
            data: {
              account: getAccount(world, components, accountEntity, accountOptions),
            },
            utils: {
              calcCurrentStamina: (account: Account) => calcCurrentStamina(account),
            },
          };
        })
      );
    },
    ({ data, utils }) => {
      const { account } = data;
      const { calcCurrentStamina } = utils;
      const { fixtures } = useVisibility();
      const [staminaCurr, setStaminaCurr] = useState(0);
      const [rotateClock, setRotateClock] = useState(0);
      const [rotateBand, setRotateBand] = useState(0);
      const [lastTick, setLastTick] = useState(Date.now());
      const [width, height] = useWindowSize();
      console.log(`width ${width} height ${height}`);

      function useWindowSize() {
        const [size, setSize] = useState([0, 0]);
        useLayoutEffect(() => {
          function updateSize() {
            setSize([window.innerWidth, window.innerHeight]);
          }
          window.addEventListener('resize', updateSize);
          updateSize();
          return () => window.removeEventListener('resize', updateSize);
        }, []);
        return size;
      }

      // ticking
      useEffect(() => {
        const tick = () => setLastTick(Date.now());
        const timerID = setInterval(tick, 1000);
        return () => clearInterval(timerID);
      }, []);

      // update the current stamina on each tick
      useEffect(() => {
        const staminaCurr = calcCurrentStamina(account);
        setStaminaCurr(staminaCurr);
      }, [account.stamina, lastTick]);

      /////////////////
      // INTERPRETATION

      const getStaminaTooltip = () => {
        const staminaTotal = account.stamina.total;
        const staminaString = `${staminaCurr}/${staminaTotal * 1}`;
        const recoveryPeriod = account.config?.stamina.recovery ?? '??';
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

      const Ticks = () => {
        let tickList = [];
        for (let i = 0; i < 36; i++) {
          tickList.push(<Tick key={i} rotationZ={i} />);
        }
        return tickList;
      };

      //Render
      return (
        <>
          <Tooltip text={getClockTooltip()}>
            <Container
              style={{ display: fixtures.menu ? 'flex' : 'none' }}
              width={width}
              height={height}
            >
              <Circle rotation={rotateClock}>
                <TicksPosition>{Ticks()}</TicksPosition>
                <BandColor rotation={rotateBand} />
                <Phases>
                  <IconNight src={ClockIcons.night} iconColor={rotateBand} rotation={rotateClock} />
                  <IconTwilight
                    src={ClockIcons.twilight}
                    iconColor={rotateBand}
                    rotation={rotateClock}
                  />
                  <IconDay src={ClockIcons.day} iconColor={rotateBand} rotation={rotateClock} />
                </Phases>
              </Circle>
            </Container>
          </Tooltip>
          <Tooltip text={getStaminaTooltip()}>
            <Container
              style={{ display: fixtures.menu ? 'flex' : 'none' }}
              width={width}
              height={height}
            >
              <StaminaText position={staminaCurr.toString().length}>
                {staminaCurr}/{account.stamina.total}
              </StaminaText>
              <SmallCircle>
                <SmallCircleFill height={calcPercent(staminaCurr, account.stamina.total)} />
              </SmallCircle>
              <ClockOverlay />
            </Container>
          </Tooltip>
          <Container
            style={{ display: fixtures.menu ? 'flex' : 'none' }}
            width={width}
            height={height}
          >
            <Time viewBox='0 0 30 4'>
              <path id='MyPath' fill='none' d='M 2.5 3.7 Q 10.5 -4 25 1.8' pathLength='2' />
              <text fill='white' fontSize='3' dominantBaseline='hanging' textAnchor='middle'>
                <textPath href='#MyPath' startOffset='0.9'>
                  {getKamiTime(Date.now())}
                </textPath>
              </text>
            </Time>
          </Container>
        </>
      );
    }
  );
}

const Container = styled.div<{ width: number; height: number }>`
  pointer-events: auto;
  position: absolute;
  left: 0vh;
  z-index: -1;
  height: fit-content;
  ${({ width, height }) => {
    const baseWidth = screen.width;
    const baseHeight = screen.height;
    const scaleX = width / baseWidth;
    const scaleY = height / baseHeight;
    let scale = Math.min(scaleX, scaleY);
    const xToY = scaleX / scaleY;
    if (scale < 0.8 && scaleY < 0.76) {
      scale = 0.8 + (0.8 - scaleY);
      if (xToY < 0.75) {
        scale = scale - (0.85 - xToY);
      }
    }
    return `transform: scale(${scale});bottom: ${scale * 22}vh;`;
  }}
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
  transform-origin: center;
  ${({ rotation }) => `transform: rotate(${rotation}deg) ;`}
  overflow:hidden;
`;

const TicksPosition = styled.div`
  position: absolute;
  left: 12.5vh;
  bottom: 12.5vh;
  transform: rotate(16deg);
`;

const Tick = styled.div<{ rotationZ: number }>`
  width: 0.1vh;
  height: 0.5vh;
  background-color: grey;
  position: absolute;
  transform-origin: 0px 7.5vh;
  transform: ${({ rotationZ }) => `translateY(-7.5vh) rotateZ(calc(${rotationZ} * 360deg / 36))`};
  z-index: 1;
`;

const Time = styled.svg`
  text-shadow:
    -1px 0 black,
    0 1px black,
    1px 0 black,
    0 -1px black;
  width: 14vh;
  height: 4vh;
  position: absolute;
  top: 1.5vh;
  left: 6vh;
`;

const StaminaText = styled.div<{ position: number }>`
  position: absolute;
  z-index: 1;
  font-size: 1vh;
  bottom: 3vh;
  color: #dde390;
  top: 14.5vh;
  left: ${({ position }) => 12 - 0.85 * position}vh;
  text-shadow:
    -1px 0 black,
    0 1px black,
    1px 0 black,
    0 -1px black;
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
  background-color: ${({ height }) => getColor(Number(height))};
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
