import styled from 'styled-components';

import { Item } from 'app/cache/item';
import { Allo } from 'network/shapes/Allo';
import { DetailedEntity } from 'network/shapes/utils';

interface Props {
  item: Item;
  utils: {
    displayRequirements: (recipe: Item) => string;
    parseAllos: (allo: Allo[]) => DetailedEntity[];
  };
}

export const ItemGridTooltip = (props: Props) => {
  const { item, utils } = props;
  const { displayRequirements, parseAllos } = utils;

  const image = item.image;
  const title = item.name;
  const type = item.type;
  const description = item.description;
  const requirements = item.requirements;
  const effects = item.effects;

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
          <p>{effects?.use?.length > 0 ? parseAllos(effects.use)[0].description : 'None'}</p>
        </Section>
      </BottomSection>
    </Container>
  );
};

const Container = styled.div`
  padding: 0.2vw;
  min-width: 20vw;
`;

const Header = styled.span`
  display: flex;
  align-items: stretch;
  background-color: transparent;
  color: #666;
  border-radius: 0.4vw;
  padding: 0 0.3vw;
`;

const Section = styled.span`
  color: #666;
  background: #f0f0f0;
  border-radius: 0.4vw;
  padding: 0 0.3vw;
  width: 100%;
`;

const SubSection = styled.span`
  display: flex;
  flex-direction: column;
  margin-left: 0.5vw;
  align-items: flex-start;
  text-align: left;
  margin-top: 0.5vw;
`;

const BottomSection = styled.div`
  display: flex;
  flex-direction: row;
  aligg-items: center;
  gap: 0.5vw;
  padding: 0.5vw;
`;

const Image = styled.img`
  width: 4.5vw;
  height: 4.5vw;
  padding: 0.3vw;
  border-radius: 0.6vw;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
  border: solid black 0.15vw;
`;

const Title = styled.div`
  font-size: 1.2vw;
  font-weight: bold;
`;

const Description = styled.div`
  margin: 0.5vw 0 0 0;
  font-size: 0.8vw;
  font-style: italic;
  white-space: normal;
`;
