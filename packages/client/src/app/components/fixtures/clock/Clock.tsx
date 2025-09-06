import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';
import styled from 'styled-components';

import { Account, calcCurrentStamina, getAccount } from 'app/cache/account';
import { TextTooltip } from 'app/components/library';
import { getColor } from 'app/components/library/measures/Battery';
import { UIComponent } from 'app/root/types';
import { useVisibility } from 'app/stores';
import { ClockIcons } from 'assets/images/icons/clock';
import { queryAccountFromEmbedded } from 'network/shapes/Account';
import { calcPercent } from 'utils/numbers';
import { getCurrPhase, getKamiTime, getPhaseName } from 'utils/time';

export const ClockFixture: UIComponent = {
  id: 'ClockFixture',
  requirement: (layers) => {
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
  Render: ({ data, utils }) => {
      const { account } = data;
      const { calcCurrentStamina } = utils;
      const menuVisible = useVisibility((s) => s.fixtures.menu);
      const [staminaCurr, setStaminaCurr] = useState(0);
      const [rotateClock, setRotateClock] = useState(0);
      const [rotateBand, setRotateBand] = useState(0);
      const [lastTick, setLastTick] = useState(Date.now());

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
        <TextTooltip text={getClockTooltip()}>
          <Container style={{ display: menuVisible ? 'flex' : 'none' }}>
            <Circle rotation={rotateClock}>
              <CircleContent>
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
                <CircleWrapper rotation={rotateClock}>
                  <ClockOverlay />
                  <TextTooltip text={getStaminaTooltip()}>
                    <SmallCircle>
                      <SmallCircleFill height={calcPercent(staminaCurr, account.stamina.total)} />
                    </SmallCircle>
                  </TextTooltip>
                  <StaminaText rotation={0}>
                    {staminaCurr}/{account.stamina.total}
                  </StaminaText>
                </CircleWrapper>
              </CircleContent>
            </Circle>
            <Time
              rotation={rotateClock}
              viewBox='0 0 30 6'
              style={{ display: menuVisible ? 'flex' : 'none' }}
            >
              <path id='MyPath' fill='none' d='M 2.5 3.5 Q 13 -3.5 27 3.5' pathLength='2' />
              <text fill='white' fontSize='3' dominantBaseline='hanging' textAnchor='middle'>
                <textPath href='#MyPath' startOffset='0.9'>
                  {getKamiTime(Date.now())}
                </textPath>
              </text>
            </Time>
          </Container>
        </TextTooltip>
      );
  },
};

const Container = styled.div`
  pointer-events: auto;
  position: fixed;
  left: 0;
  bottom: 0;
  z-index: -1;
  height: fit-content;
  user-select: none;
  --clock-size: min(25vh, 25vw);
  --base-unit: calc(var(--clock-size) / 25);
  display: flex;
  justify-content: center;
  align-items: flex-end;
  transform: translateY(10%);
`;

const Circle = styled.div<{ rotation: number }>`
  position: relative;
  height: var(--clock-size);
  width: var(--clock-size);
  border-radius: 50%;
  background-image: url(${ClockIcons.clock_base});
  background-position: center;
  background-repeat: no-repeat;
  background-size: calc(var(--clock-size) * 0.7);
  z-index: -1;
  transform-origin: center;
  ${({ rotation }) => `transform: rotate(${rotation}deg);`}
  overflow: visible;
`;

const CircleContent = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  position: relative;
`;

const TicksPosition = styled.div`
  position: absolute;
  bottom: calc(var(--clock-size) / 2);
  left: calc(var(--clock-size) / 2);
  transform: rotate(16deg);
`;

const BandColor = styled.div<{ rotation: number }>`
  min-width: 60%;
  min-height: 60%;
  position: absolute;
  top: calc(var(--clock-size) * 0.2);
  border-width: calc(var(--base-unit) / 3);
  --a: 120deg;
  aspect-ratio: 1;
  padding: calc(var(--base-unit) / 1.5);
  box-sizing: border-box;
  border-radius: 50%;
  z-index: -3;
  ${({ rotation }) => `transform: rotate(${rotation}deg);`}
  ${({ rotation }) =>
    rotation === 180
      ? `background: rgb(79 34 183 / 42%);`
      : rotation === 60
        ? `background: rgb(191 180 27 / 42%);`
        : `background: rgb(174 18 191 / 42%);`}
  mask: linear-gradient(#0000 0 0) content-box intersect,
    conic-gradient(#000 var(--a), #0000 0);
`;

const Phases = styled.div`
  position: absolute;
  left: calc(var(--base-unit) * 6);
  bottom: calc(var(--base-unit) * 6);
`;

const IconNight = styled.img<{ iconColor: number; rotation: number }>`
  position: relative;
  left: calc(var(--base-unit) * -0.2);
  bottom: calc(var(--base-unit) * 1.8);
  width: calc(var(--base-unit) * 3.3);
  ${({ iconColor }) => iconColor === 180 && `filter: opacity(0.75) drop-shadow(0 0 0 #4f22b7);`}
  ${({ rotation }) => `transform: rotate(${-rotation}deg);`}
`;

const IconTwilight = styled.img<{ iconColor: number; rotation: number }>`
  position: relative;
  left: calc(var(--base-unit) * 1.5);
  bottom: calc(var(--base-unit) * 10.8);
  width: calc(var(--base-unit) * 3.3);
  ${({ iconColor }) => iconColor === 300 && `filter: opacity(0.75) drop-shadow(0 0 0 #ae12bf);`}
  ${({ rotation }) => `transform: rotate(${-rotation}deg);`}
`;

const IconDay = styled.img<{ iconColor: number; rotation: number }>`
  position: relative;
  left: calc(var(--base-unit) * 3.2);
  bottom: calc(var(--base-unit) * 1.8);
  width: calc(var(--base-unit) * 3.3);
  ${({ iconColor }) => iconColor === 60 && `filter: opacity(0.75) drop-shadow(0 0 0 #bfb41b);`}
  ${({ rotation }) => `transform: rotate(${-rotation}deg);`}
`;

const ClockOverlay = styled.div`
  background-image: url(${ClockIcons.overlay});
  background-position: center center;
  background-size: calc(var(--clock-size) * 0.8);
  background-repeat: no-repeat;
  position: absolute;
  top: 6%;
  right: 4%;
  width: 100%;
  height: 80%;
  pointer-events: none;
  z-index: 3;
  transform-origin: center center;
`;
const StaminaText = styled.div<{ rotation: number }>`
  position: absolute;
  z-index: 5;
  font-size: calc(var(--base-unit) * 1);
  top: 57%;
  right: 38%;
  color: rgb(252, 239, 124);
  text-align: right;
  direction: rtl;
  text-shadow:
    -1px 0 black,
    0 1px black,
    1px 0 black,
    0 -1px black;
  transform-origin: right center;
  ${({ rotation }) => `transform: rotate(${-rotation}deg);`}
  pointer-events: none;
  white-space: nowrap;
  will-change: transform;
`;

const CircleWrapper = styled.div<{ rotation: number }>`
  position: relative;
  width: var(--clock-size);
  height: var(--clock-size);
  ${({ rotation }) => `transform: rotate(${-rotation}deg);`}
`;

const SmallCircle = styled.div`
  border-radius: 50%;
  height: calc(var(--base-unit) * 7.25);
  width: calc(var(--base-unit) * 7.25);
  border: calc(var(--base-unit) / 3.3) solid black;
  position: absolute;
  top: calc(var(--base-unit) * 11);
  left: calc(var(--base-unit) * 9);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  overflow: hidden;
  background-image: url(${ClockIcons.stamina_base});
  background-position: center;
  background-size: 6 * var(--clock-size);
  background-repeat: no-repeat;
  z-index: -1;
  pointer-events: auto;
`;

const SmallCircleFill = styled.div<{ height: number }>`
  height: ${({ height }) => height}%;
  position: relative;
  background-color: ${({ height }) => getColor(Number(height))};
  pointer-events: none;
`;

const Time = styled.svg<{ rotation: number }>`
  text-shadow:
    black -1px 0px,
    black 0px 1px,
    black 1px 0px,
    black 0px -1px;
  position: absolute;
  top: calc(var(--clock-size) * 0.04);
  width: calc(var(--clock-size) * 0.56);
  height: calc(var(--clock-size) * 0.22);
  pointer-events: none;
`;

const Tick = styled.div<{ rotationZ: number }>`
  width: calc(var(--base-unit) / 7);
  height: calc(var(--base-unit) / 2);
  background-color: grey;
  position: absolute;
  transform-origin: 0 calc(var(--clock-size) / 3.33);
  transform: ${({ rotationZ }) =>
    `translateY(calc(-1 * var(--clock-size) / 3.33)) rotateZ(calc(${rotationZ} * 360deg / 36))`};
  z-index: 1;
`;
