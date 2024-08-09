import styled from 'styled-components';

import { Tooltip } from 'app/components/library';
import { Account } from 'network/shapes/Account';
import { Quest } from 'network/shapes/Quest';
import { getFactionImage } from 'network/shapes/utils/images';

interface Props {
  account: Account;
  quests: {
    agency: Quest[];
    ongoing: Quest[];
    completed: Quest[];
  };
}

export const Battlepass = (props: Props) => {
  const { account, quests } = props;

  console.log(quests);

  return (
    <Container>
      <Tooltip
        text={[
          `REPUTATION represents your relationship with the Kamigotchi Tourism Agency.`,
          '',
          `This is what you'll need for more, uh, permanent rewards....`,
        ]}
      >
        <Icon src={getFactionImage('agency')} />
      </Tooltip>

      <Balance>{Number(account.reputation.agency)}</Balance>
    </Container>
  );
};

const Container = styled.div`
  padding: 0.7vh 0.8vw;

  display: flex;
  flex-flow: column no-wrap;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`;

const Text = styled.p`
  color: black;
  font-family: Pixel;
  font-size: 1vw;
`;

const Balance = styled.div`
  border: solid #666 0.15vw;
  border-radius: 0.3vw;
  padding: 0.5vw;
  width: 50%;

  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-end;

  color: black;
  font-family: Pixel;
  font-size: 1vw;
`;

const Icon = styled.img`
  height: 1.5vw;
  width: 1.5vw;
`;
