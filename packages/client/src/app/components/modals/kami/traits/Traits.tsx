import styled from 'styled-components';

import { TextTooltip } from 'app/components/library';
import { getRarities } from 'constants/rarities';
import { StatIcons } from 'constants/stats';
import { Kami } from 'network/shapes/Kami';
import { Trait } from 'network/shapes/Trait';

export const Traits = ({
  kami,
}: {
  kami: Kami;
}) => {
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
              <TextTooltip key={name} text={tooltipText}>
                <InfoBox color={getRarities(trait.rarity).color}>
                  <InfoIcon src={details?.image} />
                  <InfoNumber>{stat.base}</InfoNumber>
                </InfoBox>
              </TextTooltip>
            );
          })}
        </Content>
      </Container>
    );
  };

  return (
    <>
      {TraitBox('Body', kami.traits?.body!)}
      {TraitBox('Hands', kami.traits?.hand!)}
      {TraitBox('Face', kami.traits?.face!)}
      {TraitBox('Color', kami.traits?.color!)}
      {TraitBox('Background', kami.traits?.background!)}
    </>
  );
};

const Container = styled.div`
  border: solid black 0.15em;
  border-radius: 0.5em;
  margin: 0.7em;
  padding: 0.5em;

  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  user-select: none;
`;

const Title = styled.div`
  padding: 0.5em;
  color: black;
  font-family: Pixel;
  font-size: 1.5em;
`;

const Content = styled.div`
  padding: 0.7em;

  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: center;
`;

const InfoBox = styled.div<{ color: string }>`
  border: solid black 0.12em;
  border-radius: 5px;
  margin: 0.3em;
  padding: 0.5em 1em;
  gap: 0.5em;
  ${({ color }) => `background-color: ${color ?? 'white'};`}
  display: flex;
  flex-direction: row nowrap;
  justify-content: space-between;

  &:hover {
    filter: brightness(120%);
  }
`;

const InfoIcon = styled.img`
  height: 2em;
  align-self: center;
`;

const InfoNumber = styled.div`
  color: black;
  align-self: center;

  font-size: 1.2em;
  font-family: Pixel;
  margin: auto;
`;
