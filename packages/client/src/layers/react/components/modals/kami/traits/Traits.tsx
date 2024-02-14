import styled from 'styled-components';

import { StatIcons } from 'assets/images/icons/stats';
import { Tooltip } from 'layers/react/components/library/Tooltip';
import { Kami } from 'layers/network/shapes/Kami';
import { Trait } from 'layers/network/shapes/Trait';

interface Props {
  kami: Kami;
}

export const Traits = (props: Props) => {
  const statsDetails = new Map(
    Object.entries({
      health: {
        description: 'Health defines how resilient a Kami is to accumulated damage',
        image: StatIcons.health,
      },
      power: {
        description: 'Power determines the potential rate at which $MUSU can be farmed',
        image: StatIcons.power,
      },
      violence: {
        description: 'Violence dictates the threshold at which a Kami can liquidate others',
        image: StatIcons.violence,
      },
      harmony: {
        description: 'Harmony divines resting recovery rate and defends against violence',
        image: StatIcons.harmony,
      },
      slots: {
        description: 'Slots are room for upgrades ^_^',
        image: StatIcons.slots,
      },
    })
  );

  const TraitBox = (type: string, trait: Trait) => {
    const statArray = Object.entries(trait.stats).filter(([_, value]) => value > 0);
    return (
      <Container>
        <Title>{`${type}: ${trait.name}`}</Title>
        <Content>
          {statArray.map(([name, value]) => {
            const details = statsDetails.get(name);
            const tooltipText = [details?.description ?? ''];
            return (
              <Tooltip key={name} text={tooltipText}>
                <InfoBox>
                  <InfoIcon src={details?.image} />
                  <InfoNumber>{value}</InfoNumber>
                </InfoBox>
              </Tooltip>
            );
          })}
        </Content>
      </Container>
    );
  };

  return (
    <>
      {TraitBox('Body', props.kami.traits?.body!)}
      {TraitBox('Hands', props.kami.traits?.hand!)}
      {TraitBox('Face', props.kami.traits?.face!)}
      {TraitBox('Color', props.kami.traits?.color!)}
      {TraitBox('Background', props.kami.traits?.background!)}
    </>
  );
};

const Container = styled.div`
  border: solid black 0.15vw;
  border-radius: 0.5vw;
  margin: 0.7vw;
  padding: 0.5vw;

  display: flex;
  flex-flow: row nowrap;
  align-items: center;
`;

const Title = styled.div`
  padding: 0.5vw;
  color: black;
  font-family: Pixel;
  font-size: 1.5vw;
`;

const Content = styled.div`
  padding: 0.7vw;

  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: center;
`;

const InfoBox = styled.div`
  border: solid black 0.12vw;
  border-radius: 5px;
  margin: 0.3vw;
  padding: 0.5vw 1vw;
  gap: 0.5vw;

  display: flex;
  flex-direction: row nowrap;
  justify-content: space-between;

  &:hover {
    background-color: #ddd;
  }
`;

const InfoIcon = styled.img`
  height: 2vw;
  align-self: center;
`;

const InfoNumber = styled.div`
  color: black;
  align-self: center;

  font-size: 1.2vw;
  font-family: Pixel;
  margin: auto;
`;
