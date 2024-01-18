import { Kami } from "layers/react/shapes/Kami";
import styled from "styled-components";

import { StatIcons } from "assets/images/icons/stats";
import { ExperienceBar } from "layers/react/components/library/ExperienceBar";
import { Tooltip } from "layers/react/components/library/Tooltip";
import { useSelected } from "layers/react/store/selected";
import { useVisibility } from "layers/react/store/visibility";
import { playClick } from "utils/sounds";

interface Props {
  kami: Kami;
  actions: {
    levelUp: (kami: Kami) => void,
    toggleSkills: () => void,
  }
}

export const Banner = (props: Props) => {
  const { setAccount } = useSelected();
  const { modals, setModals } = useVisibility();
  const statsArray = Object.entries(props.kami.stats);
  const affinities = props.kami.affinities?.join(' | ');
  const statsDetails = new Map(Object.entries({
    'health': {
      description: 'Health defines how resilient a Kami is to accumulated damage',
      image: StatIcons.health,
      base: props.kami.stats.health,
      bonus: props.kami.bonusStats.health,
    },
    'power': {
      description: 'Power determines the potential rate at which $MUSU can be farmed',
      image: StatIcons.power,
      base: props.kami.stats.power,
      bonus: props.kami.bonusStats.power,
    },
    'violence': {
      description: 'Violence dictates the threshold at which a Kami can liquidate others',
      image: StatIcons.violence,
      base: props.kami.stats.violence,
      bonus: props.kami.bonusStats.violence,
    },
    'harmony': {
      description: 'Harmony divines resting recovery rate and defends against violence',
      image: StatIcons.harmony,
      base: props.kami.stats.harmony,
      bonus: props.kami.bonusStats.harmony,
    },
    'slots': {
      description: 'Slots are room for upgrades ^_^',
      image: StatIcons.slots,
      base: props.kami.stats.slots,
      bonus: props.kami.bonusStats.slots,
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
              level={props.kami.level}
              current={props.kami.experience.current}
              total={props.kami.experience.threshold}
              triggerLevelUp={() => props.actions.levelUp(props.kami)}
            />
          </TitleRow>
        </ContentTop>
        <ContentMiddle>
          {statsArray.map((stat: [string, number]) => {
            const details = statsDetails.get(stat[0]);
            const valueString = `${details?.base! + details?.bonus!}`;
            const tooltipText = [`${details?.base} + ${details?.bonus}`, details?.description ?? ''];
            return (
              <Tooltip key={stat[0]} text={tooltipText} grow>
                <InfoBox>
                  <Icon src={details?.image} />
                  <InfoContent>{valueString}</InfoContent>
                </InfoBox>
              </Tooltip>
            );
          })}
        </ContentMiddle>
        <Footer>
          <FooterText
            style={{ cursor: 'pointer' }}
            onClick={() => {
              setAccount(props.kami.account?.index || 0);
              setModals({ ...modals, account: true, kami: false, party: false, map: false });
              playClick();
            }}
          >
            {props.kami.account?.name}
          </FooterText>
        </Footer>
      </Content>
    </Container>
  );
}

const Container = styled.div`
  border-bottom: solid black .15vw;
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
  margin: 1vw .3vw .5vw .3vw;
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
  padding: .3vw;
  align-self: center;

  font-family: Pixel;
  font-size: .8vw;
  font-weight: 600;
  margin: auto;
`;

const Footer = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: .7vw;

  display: flex;
  justify-content: flex-end;
`;

const FooterText = styled.div`
  font-family: Pixel;
  font-size: .6vw;
  text-align: right;
  color: #666;

  &:hover {
    color: #ccc;
  }
`;
