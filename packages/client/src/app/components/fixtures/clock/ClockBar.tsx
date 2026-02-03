import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { Account, calcCurrentStamina as _calcCurrentStamina, getAccount } from 'app/cache/account';
import { TextTooltip } from 'app/components/library';
import { getColor } from 'app/components/library/measures/Battery';
import { useLayers } from 'app/root/hooks';
import { UIComponent } from 'app/root/types';
import { queryAccountFromEmbedded } from 'network/shapes/Account';
import { calcPercent } from 'utils/numbers';
import { getCurrPhase, getKamiTime, getPhaseName } from 'utils/time';

export const ClockBarFixture: UIComponent = {
  id: 'ClockBarFixture',
  Render: () => {
    const layers = useLayers();

    const {
      data: { account },
      utils: { calcCurrentStamina },
    } = (() => {
      const { network } = layers;
      const { world, components } = network;
      const accountEntity = queryAccountFromEmbedded(network);
      const accountOptions = { config: 3600, live: 2 };

      return {
        data: {
          account: getAccount(world, components, accountEntity, accountOptions),
        },
        utils: {
          calcCurrentStamina: (account: Account) => _calcCurrentStamina(account),
        },
      };
    })();

    const [staminaCurr, setStaminaCurr] = useState(0);
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

    const staminaPercent = calcPercent(staminaCurr, account.stamina.total);

    const getStaminaTooltip = () => {
      const staminaTotal = account.stamina.total;
      const staminaString = `${staminaCurr}/${staminaTotal}`;
      const recoveryPeriod = account.config?.stamina.recovery ?? '??';
      return [
        `Account Stamina (${staminaString})`,
        '',
        `Determines how far your Operator can travel. Recovers by 1 every ${recoveryPeriod}s`,
      ];
    };

    const getTimeTooltip = () => {
      const phase = getPhaseName(getCurrPhase());
      return [
        `Kami World Clock (${phase}): ${getKamiTime(Date.now())}`,
        '',
        `Kamigotchi World operates on a 36h day with three distinct phases: Daylight, Evenfall, and Moonside.`,
      ];
    };

    /////////////////
    // RENDER

    return (
      <Container>
        <TextTooltip text={getStaminaTooltip()}>
          <StaminaSection>
            <StaminaBar>
              <StaminaFill percent={staminaPercent} />
            </StaminaBar>
            <StaminaText>
              {staminaCurr}/{account.stamina.total}
            </StaminaText>
          </StaminaSection>
        </TextTooltip>
        <TextTooltip text={getTimeTooltip()}>
          <TimeSection>
            <TimeText>{getKamiTime(Date.now())}</TimeText>
          </TimeSection>
        </TextTooltip>
      </Container>
    );
  },
};

const Container = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.5em;
  padding: 0.3em;
  background-color: rgba(247, 247, 246, 1);
  border: 2px solid black;
  border-radius: 0.5em;
  pointer-events: auto;
  user-select: none;
  height: 10cqi;
`;

const StaminaSection = styled.div`
  width: 70cqi;
  height: 3cqi;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.5em;
`;

const StaminaBar = styled.div`
  width: 100%;
  height: 7cqi;
  background-color: rgba(50, 50, 50, 0.8);

  border-radius: 0.3em;
  overflow: hidden;
`;

const StaminaFill = styled.div<{ percent: number }>`
  width: ${({ percent }) => percent}%;
  height: 100%;
  background-color: ${({ percent }) => getColor(percent)};
  transition: width 0.3s ease;
`;

const StaminaText = styled.div`
  position: absolute;
  left: 33cqi;
  font-size: 4cqi;
  font-weight: bold;
  color: rgba(255, 237, 74, 1);
  text-shadow:
    -1px 0 black,
    0 1px black,
    1px 0 black,
    0 -1px black;
  white-space: nowrap;
`;

const TimeSection = styled.div`
  padding-left: 0.5em;
`;

const TimeText = styled.div`
  font-size: 3.5cqi;
  color: black;
  font-weight: bold;
  white-space: nowrap;
`;
