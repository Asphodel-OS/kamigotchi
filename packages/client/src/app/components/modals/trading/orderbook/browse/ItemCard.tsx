import styled from 'styled-components';

import { Item } from 'network/shapes';

export const ItemCard = ({ item, selected, onClick }: { item: Item; selected: boolean; onClick: () => void }) => {
  return (
    <Card onClick={onClick} selected={selected} title={item.name}>
      <Image src={item.image} alt={item.name} />
      <Name>{item.name}</Name>
    </Card>
  );
};

const Card = styled.button<{ selected: boolean }>`
  position: relative;
  width: 6.6vw;
  min-width: 6.6vw;
  height: 7.8vw;
  border: 0.15vw solid black;
  border-radius: 0.3vw;
  background: ${({ selected }) => (selected ? '#d6ffd6' : '#f5f5f5')};
  padding: 0.6vw;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
  &:hover {
    background: ${({ selected }) => (selected ? '#c6f5c6' : '#eaeaea')};
  }
`;

const Image = styled.img`
  width: 3.6vw;
  height: 3.6vw;
  image-rendering: pixelated;
  background: #ddd;
  object-fit: contain;
  &:not([src]), &:where([src=""]) { opacity: 0.5; }
`;

const Name = styled.div`
  width: 100%;
  font-size: 0.84vw;
  line-height: 1.2vw;
  text-align: center;
  color: #222;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;


