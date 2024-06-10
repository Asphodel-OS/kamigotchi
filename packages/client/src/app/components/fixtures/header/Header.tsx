import { interval, map } from 'rxjs';
import styled from 'styled-components';

import { Battery, Tooltip } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { useVisibility } from 'app/stores';
import musuIcon from 'assets/images/icons/musu.png';
import {
  Account,
  calcStamina,
  calcStaminaPercent,
  getAccountFromBurner,
} from 'network/shapes/Account';
import { getRoomByIndex } from 'network/shapes/Room';

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
      const { network } = layers;
      const { world, components } = network;

      return interval(1000).pipe(
        map(() => {
          const account = getAccountFromBurner(network);
          return {
            data: {
              account,
              room: getRoomByIndex(world, components, account.roomIndex),
            },
          };
        })
      );
    },
    ({ data }) => {
      // console.log('mAccountInfo:', data);
      const { account, room } = data;
      const { fixtures } = useVisibility();

      /////////////////
      // INTERPRETATION

      const parseStaminaString = (account: Account) => {
        const staminaCurr = calcStamina(account);
        const staminaTotal = account.stamina.total;
        return `${staminaCurr}/${staminaTotal * 1}`;
      };

      // parses and input epoch time in seconds to KamiWorld Military Time (36h days)
      const parseTimeString = (time: number) => {
        time = Math.floor(time);
        const seconds = time % 60;
        time = Math.floor(time / 60);
        const minutes = time % 60;
        time = Math.floor(time / 60);
        const hours = time % 36;

        const hourString = hours.toString().padStart(2, '0');
        const minuteString = minutes.toString().padStart(2, '0');
        const secondString = seconds.toString().padStart(2, '0');

        return `${hourString}:${minuteString}:${secondString}`;
      };

      /////////////////
      // CONTENT

      const getStaminaTooltip = (account: Account) => {
        const staminaString = parseStaminaString(account);
        const recoveryPeriod = Math.round(1 / account.stamina.rate);
        return [
          `Account Stamina (${staminaString})`,
          '',
          `Determines how far your Operator can travel. Recovers by 1 every ${recoveryPeriod}s`,
        ];
      };

      const getTimeTooltip = () => {
        return [`Kami World Clock`, '', `Kamigotchi World operates on a 36h day.`];
      };

      const getMusuTooltip = () => {
        return [
          'Musubi (musu)',
          '',
          'The interconnecting energy of the universe. Collect it from nodes with your Kamis.',
        ];
      };

      return (
        <Container id='header' style={{ display: fixtures.header ? 'block' : 'none' }}>
          <Row>
            <TextBox>{`${account.name} - ${room.name}`}</TextBox>
          </Row>
          <Line />
          <Row>
            <Cell>
              <Tooltip text={getStaminaTooltip(account)}>
                <TextBox>
                  {`${calcStaminaPercent(account)}%`}
                  <Battery level={calcStaminaPercent(account)} />
                </TextBox>
              </Tooltip>
            </Cell>
            <Cell>
              <Tooltip text={getTimeTooltip()}>
                <TextBox>{parseTimeString(Date.now() / 1000)}</TextBox>
              </Tooltip>
            </Cell>
            <Cell style={{ borderWidth: 0 }}>
              <Tooltip text={getMusuTooltip()}>
                <TextBox>
                  <Icon src={musuIcon} />
                  {account.coin}
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
  height: 9vh;

  display: flex;
  flex-flow: column nowrap;
  justify-content: space-around;
  align-items: center;

  pointer-events: auto;
`;

const Row = styled.div`
  width: 100%;
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-evenly;
  height: 50%;

  flex-grow: 1;
`;

const Line = styled.div`
  border-top: 0.15vw solid black;
  width: 100%;
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
