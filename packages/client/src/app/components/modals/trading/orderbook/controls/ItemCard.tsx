import styled from 'styled-components';

import { Item } from 'network/shapes';

export const ItemCard = ({
  item,
  selected,
  onClick,
}: {
  item: Item;
  selected: boolean;
  onClick: () => void;
}) => {
  return (
    <Card
      onClick={onClick}
      selected={selected}
      title={item.name}
      role='button'
      tabIndex={0}
      aria-pressed={selected}
    >
      {item.image ? <Image src={item.image} alt={item.name} loading='lazy' /> : null}
      <Name>{item.name}</Name>
    </Card>
  );
};

const Card = styled.button<{ selected: boolean }>`
  position: relative;
  width: 6.6em;
  min-width: 6.6em;
  height: 7.8em;
  border: 0.15em solid black;
  border-radius: 0.3em;
  background: ${({ selected }) => (selected ? '#d6ffd6' : '#f5f5f5')};
  padding: 0.6em;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
  &:hover {
    background: ${({ selected }) => (selected ? '#c6f5c6' : '#eaeaea')};
  }
  &:focus-visible {
    outline: 0.18em solid #66a3ff;
    outline-offset: 0.12em;
  }
`;

const Image = styled.img`
  width: 3.6em;
  height: 3.6em;
  image-rendering: pixelated;
  background: #ddd;
  object-fit: contain;
  &:not([src]),
  &:where([src='']) {
    opacity: 0.5;
  }
`;

const Name = styled.div`
  width: 100%;
  font-size: 0.84em;
  line-height: 1.2em;
  text-align: center;
  color: #222;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
