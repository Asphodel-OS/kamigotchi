import styled from 'styled-components';

import { Item } from 'app/cache/item';
import { Allo } from 'network/shapes/Allo';
import { DetailedEntity } from 'network/shapes/utils';

export const ItemGridTooltip = ({
  item,
  utils: {
    displayRequirements,
    parseAllos,
  },
}: {
  item: Item;
  utils: {
    displayRequirements: (recipe: Item) => string;
    parseAllos: (allo: Allo[]) => DetailedEntity[];
  };
}) => {

  const image = item.image;
  const title = item.name;
  const type = item.type;
  const description = item.description;
  const requirements = item.requirements;
  const effects = item.effects;

  const isLootbox = type === 'LOOTBOX';

  const display = (item: Item) => {
    const disp = displayRequirements(item);
    if (disp === '???') return 'None';
    else return disp;
  };

  return (
    <Container>
      <Header>
        <Image src={image} />
        <SubSection>
          <Title>{title}</Title>
          Type: {type}
        </SubSection>
      </Header>

      <Description>{description}</Description>
      <BottomSection>
        <Section>
          Requirements: <p>{requirements?.use?.length > 0 ? display(item) : 'None'}</p>
        </Section>
        <Section>
          Effects:
          <p>
            {!isLootbox && effects?.use?.length > 0
              ? parseAllos(effects.use)
                  .map((entry) => entry.description)
                  .join('\n')
              : 'None'}
          </p>
        </Section>
      </BottomSection>
    </Container>
  );
};

const Container = styled.div`
  padding: 0.2em;
  min-width: 20em;
`;

const Header = styled.span`
  display: flex;
  align-items: stretch;
  background-color: transparent;
  color: #666;
  border-radius: 0.4em;
  padding: 0 0.3em;
`;

const Section = styled.span`
  color: #666;
  background: #f0f0f0;
  border-radius: 0.4em;
  padding: 0 0.3em;
  width: 100%;
`;

const SubSection = styled.span`
  display: flex;
  flex-direction: column;
  margin-left: 0.5em;
  align-items: flex-start;
  text-align: left;
  margin-top: 0.5em;
`;

const BottomSection = styled.div`
  display: flex;
  flex-direction: row;
  align-items: stretch;
  gap: 0.5em;
  padding: 0.5em;
`;

const Image = styled.img`
  width: 4.5em;
  height: 4.5em;
  padding: 0.3em;
  border-radius: 0.6em;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
  border: solid black 0.15em;
`;

const Title = styled.div`
  font-size: 1.2em;
  font-weight: bold;
`;

const Description = styled.div`
  margin: 0.5em 0 0 0;
  font-size: 0.8em;
  font-style: italic;
  white-space: normal;
`;
