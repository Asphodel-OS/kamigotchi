import styled, { keyframes } from 'styled-components';

import { Tooltip } from 'app/components/library';
import musuIcon from 'assets/images/icons/musu.png';
import { Listing } from 'network/shapes/Listing';
import { playClick } from 'utils/sounds';

export interface Props {
  listing: Listing;
  toggle: () => void;
}

// TODO: support multiple buys
export const CatalogRow = (props: Props) => {
  const { listing, toggle } = props;

  const handleClick = () => {
    playClick();
    toggle();
  };

  return (
    <Container key={listing.item.index} onClick={() => handleClick()}>
      <Tooltip text={[listing.item.description ?? '']}>
        <Image src={listing.item.image} />
      </Tooltip>
      <Tooltip text={[listing.item.description ?? '']}>
        <Details>
          <Text>{listing.item.name}</Text>
          <Text>
            <Icon src={musuIcon} />
            {listing.buyPrice}
          </Text>
        </Details>
      </Tooltip>
    </Container>
  );
};

const Container = styled.div`
  border: 0.15vw solid black;
  border-radius: 0.4vw;
  margin: 0.4vw;
  display: flex;
  flex-direction: row nowrap;
  align-items: center;

  cursor: pointer;
  &:hover {
    animation: ${() => hover} 0.2s;
    transform: scale(1.02);
    background-color: #ddd;
  }
  &:active {
    animation: ${() => click} 0.3s;
  }
`;

const Image = styled.img`
  border-right: 0.15vw solid black;
  width: 4.5vw;
  padding: 0.45vw;
  font-family: Pixel;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
`;

const Details = styled.div`
  display: flex;
  flex-flow: column nowrap;
  justify-content: space-around;
  align-items: flex-start;
  height: 100%;
  padding: 0.5vw;
`;

const Text = styled.div`
  color: black;
  font-family: Pixel;
  font-size: 0.9vw;
  line-height: 1.5vw;

  display: flex;
  flex-flow: row nowrap;
  align-items: center;
`;

const Icon = styled.img`
  width: 1.5vw;
  height: 1.5vw;
  margin-right: 0.3vw;
`;

const hover = keyframes`
  0% { transform: scale(1); }
  100% { transform: scale(1.02); }
`;

const click = keyframes`
  0% { transform: scale(1.02); }
  50% { transform: scale(.98); }
  100% { transform: scale(1.02); }
`;
