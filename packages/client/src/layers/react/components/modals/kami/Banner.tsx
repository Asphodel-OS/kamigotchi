import { Kami } from "layers/react/shapes/Kami";
import styled from "styled-components";
import { ExperienceBar } from "../../library/ExperienceBar";
import { Tooltip } from "../../library/Tooltip";

interface Props {
  kami: Kami;
  actions: {
    levelUp: (kami: Kami) => void;
  }
}

export const Banner = (props: Props) => {
  const statsArray = Object.entries(props.kami.stats);
  const affinities = props.kami.affinities?.join(' | ');
  const statsDescriptions = new Map(Object.entries({
    'health': 'defines how resilient a Kami is to accumulated damage',
    'power': 'determines the potential rate at which $MUSU can be farmed',
    'violence': 'dictates the threshold at which a Kami can liquidate others',
    'harmony': 'divines resting recovery rate and defends against violence',
    'slots': 'room for upgrades ^_^',
  }));

  return (
    <Container>
      <Image src={props.kami.uri} />
      <Content>
        <ContentTop>
          <TitleRow>
            <Title>{props.kami.name}</Title>
            <Subtext>{affinities}</Subtext>
          </TitleRow>
          <ExperienceBar
            level={props.kami.level * 1}
            current={props.kami.experience.current * 1}
            total={props.kami.experience.threshold}
            triggerLevelUp={() => props.actions.levelUp(props.kami)}
          />
        </ContentTop>
        <ContentBottom>
          {statsArray.map((stat: [string, number]) => {
            return (
              <Tooltip key={stat[0]} text={[statsDescriptions.get(stat[0]) as string]} grow>
                <InfoBox>
                  <InfoLabel>{stat[0].toUpperCase()}</InfoLabel>
                  <InfoContent>{stat[1] * 1}</InfoContent>
                </InfoBox>
              </Tooltip>
            );
          })}
        </ContentBottom>
      </Content>
    </Container>
  );
}

const Container = styled.div`
  color: black;

  display: flex;
  flex-flow: row nowrap;
`;

const Image = styled.img`
  border-radius: 8px 0px 0px 0px;
  border-right: solid black .15vw;
  height: 14vw;
`;

const Content = styled.div`
  flex-grow: 1;
  padding: 1.4vw .7vw .7vw .7vw;

  display: flex;
  flex-flow: column nowrap;
  justify-content: space-between;
`;

const ContentTop = styled.div`
  display: flex;
  flex-flow: column nowrap;
`;

const TitleRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: flex-end;
  margin: 1vw .3vw .7vw .3vw;
`;

const Title = styled.div`
  background-color: #ffffff;

  color: black;
  font-family: Pixel;
  font-size: 2vw;
`;

const Subtext = styled.div`
  padding: 0 0 .1vw .6vw;
  
  color: #666;
  font-family: Pixel;
  font-size: .9vw;
`;

const ContentBottom = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: row wrap;
  align-items: center;
`;

const InfoBox = styled.div`
  border: solid black .12vw;
  border-radius: 5px;
  margin: .3vw;
  padding: .3vw;
  
  display: flex;
  flex-direction: column;
`

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