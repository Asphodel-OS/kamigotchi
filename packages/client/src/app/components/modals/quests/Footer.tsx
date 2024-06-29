import { Tooltip } from 'app/components/library';
import styled from 'styled-components';

interface Props {
  balance: number;
}

export const Footer = (props: Props) => {
  return (
    <Container>
      <Tooltip
        text={[
          `REPUTATION represents your relationship with the Kamigotchi Tourism Agency.`,
          '',
          `This is what you'll need for more, uh, permanent rewards....`,
        ]}
      >
        <Text>REPUTATION: </Text>
      </Tooltip>

      <Balance>{Number(props.balance)}</Balance>
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
