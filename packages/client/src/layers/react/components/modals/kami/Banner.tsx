import { Kami } from "layers/react/shapes/Kami";
import styled from "styled-components";
import { ExperienceBar } from "../../library/ExperienceBar";
import { Tooltip } from "../../library/Tooltip";
import { ActionButton } from "../../library/ActionButton";
import {
  healthIcon,
  powerIcon,
  violenceIcon,
  harmonyIcon,
} from "assets/images/icons/stats";
import placeholderIcon from "assets/images/icons/exit_native.png";

interface Props {
  kami: Kami;
  actions: {
    levelUp: (kami: Kami) => void,
    toggleSkills: () => void,
  }
}

export const Banner = (props: Props) => {
  const statsArray = Object.entries(props.kami.stats);
  const affinities = props.kami.affinities?.join(' | ');
  const statsDetails = new Map(Object.entries({
    'health': {
      description: 'Health defines how resilient a Kami is to accumulated damage',
      image: healthIcon,
    },
    'power': {
      description: 'Power determines the potential rate at which $MUSU can be farmed',
      image: powerIcon,
    },
    'violence': {
      description: 'Violence dictates the threshold at which a Kami can liquidate others',
      image: violenceIcon,
    },
    'harmony': {
      description: 'Harmony divines resting recovery rate and defends against violence',
      image: harmonyIcon,
    },
    'slots': {
      description: 'Slots are room for upgrades ^_^',
      image: placeholderIcon,
    },
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
          <TitleRow>
            <ExperienceBar
              level={props.kami.level * 1}
              current={props.kami.experience.current * 1}
              total={props.kami.experience.threshold}
              triggerLevelUp={() => props.actions.levelUp(props.kami)}
            />
            <Tooltip text={['Skill Points']}>
              <ActionButton
                id={`level-button`}
                onClick={() => props.actions.toggleSkills()}
                text={` (${props.kami.skillPoints > 0 ? Number(props.kami.skillPoints) : '+'}) `}
                size='small'
                pulse={props.kami.skillPoints > 0}
              />
            </Tooltip>
          </TitleRow>
        </ContentTop>
        <ContentMiddle>
          {statsArray.map((stat: [string, number]) => {
            return (
              <Tooltip key={stat[0]} text={[statsDetails.get(stat[0])?.description as string]} grow>
                <InfoBox>
                  <Icon src={statsDetails.get(stat[0])?.image} />
                  <InfoContent>{stat[1] * 1}</InfoContent>
                </InfoBox>
              </Tooltip>
            );
          })}
        </ContentMiddle>
        <Footer>{props.kami.account?.name}</Footer>
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

const Icon = styled.img`
  height: 2vw;
`;

const Content = styled.div`
  flex-grow: 1;
  padding: .7vw;

  display: flex;
  flex-flow: column nowrap;
  justify-content: space-between;
  position: relative;
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
  margin: 1.5vw .3vw .7vw .3vw;
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

const ContentMiddle = styled.div`
  flex-grow: 1;
  width: 80%;
  display: flex;
  flex-direction: row wrap;
  align-items: center;
  justify-content: flex-start;
`;

const InfoBox = styled.div`
  border: solid black .12vw;
  border-radius: 5px;
  margin: .3vw;
  padding: .3vw;
  
  display: flex;
  flex-direction: row;
  &:hover {
    background-color: #ddd;
  }
`

const InfoContent = styled.div`
  color: black;
  padding: 5px;
  align-self: center;

  font-family: Pixel;
  font-size: 1.2vw;
  font-weight: 600;
  margin: auto;
`;

const Footer = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: .7vw;
  
  font-family: Pixel;
  font-size: .6vw;
  text-align: right;
  color: #666;
`;
