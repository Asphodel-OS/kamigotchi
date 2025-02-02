import styled from 'styled-components';

import { Tooltip } from 'app/components/library';
import { StatIcons } from 'constants/stats';
import { Kami } from 'network/shapes/Kami';
import { Trait } from 'network/shapes/Trait';

interface Props {
  kami: Kami;
}
const rarityColors: { [index: string]: string } = {
  '0x09': '#c9c7c7',
  '0x08': '#a1c181',
  '0x07': '#9cbcd2',
  '0x06': '#bca0ff',
  '0x04': '#ffb226',
};
export const Traits = (props: Props) => {
  const statsDetails = new Map(
    Object.entries({
      health: {
        description: 'Health defines how resilient a Kami is to accumulated damage',
        image: StatIcons.health,
      },
      power: {
        description: 'Power determines the potential rate at which MUSU can be farmed',
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
    const statArray = Object.entries(trait.stats).filter(([_, stat]) => stat.base > 0);
    return (
      <Container>
        <Title>{`${type}: ${trait.name}`}</Title>
        <Content>
          {statArray.map(([name, stat]) => {
            const details = statsDetails.get(name);
            const tooltipText = [details?.description ?? ''];
            return (
              <Tooltip key={name} text={tooltipText}>
                <InfoBox rarity={rarityColors[trait.rarity]}>
                  <InfoIcon src={details?.image} />
                  <InfoNumber>{stat.base}</InfoNumber>
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

const InfoBox = styled.div<{ rarity: string }>`
  border: solid black 0.12vw;
  border-radius: 5px;
  margin: 0.3vw;
  padding: 0.5vw 1vw;
  gap: 0.5vw;
  ${({ rarity }) => `background-color: ${rarity ?? 'white'};`}
  display: flex;
  flex-direction: row nowrap;
  justify-content: space-between;

  &:hover {
    filter: brightness(120%);
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
