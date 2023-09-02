import styled from 'styled-components';

import { Kami } from "layers/react/shapes/Kami";
import { Tooltip } from "../../library/Tooltip";
import { Trait } from "layers/react/shapes/Trait";

interface Props {
  kami: Kami;
}

export const Traits = (props: Props) => {

  // get the stats text from a trait
  const getStatsText = (trait: Trait) => {
    const statArray = Object.entries(trait.stats).filter((stat: [string, number]) => stat[1] > 0);
    return statArray.map(
      (stat: [string, number]) => {
        const name = stat[0].charAt(0).toUpperCase() + stat[0].slice(1);
        const value = stat[1] * 1;
        return `${name}: ${value}`;
      }
    );
  }

  return (
    <Container>
      <Title>Traits</Title>
      <Content>
        {Object.entries(props.kami.traits!).map((trait: [string, Trait]) => {
          const statsText = getStatsText(trait[1]);
          return (
            <Tooltip key={trait[0]} text={['STATS'].concat(statsText)} grow>
              <InfoBox>
                <InfoLabel>{trait[0].toUpperCase()}</InfoLabel>
                <InfoContent>{trait[1].name}</InfoContent>
              </InfoBox>
            </Tooltip>
          );
        })}
      </Content>
    </Container>
  );
}

const Container = styled.div`
  border: solid black .15vw;
  border-radius: .5vw;
  margin: .7vw;
  padding: .7vw;

  display: flex;
  flex-flow: column nowrap;
`;

const Title = styled.div`
  padding: .5vw;  
  color: black;
  font-family: Pixel;
  font-size: 2vw;
`;

const Content = styled.div`
  flex-grow: 1;
  padding: 1.4vw .7vw .7vw .7vw;

  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
`;

const InfoBox = styled.div`
  border: solid black .12vw;
  border-radius: 5px;
  margin: .3vw;
  padding: .3vw;
  
  display: flex;
  flex-direction: column;

  &:hover {
    background-color: #ddd;
  }
`;

const InfoLabel = styled.div`
  margin: .3vw;
  align-self: flex-start;
  
  color: black;
  font-family: Pixel;
  font-size: .9vw;
`;

const InfoContent = styled.div`
  color: black;
  padding: 5px;
  align-self: center;

  font-size: 1.2vw;
  font-weight: 600;
  font-family: Pixel;
  margin: auto;
`;