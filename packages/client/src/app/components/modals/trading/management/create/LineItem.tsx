import { ChangeEvent } from 'react';
import styled from 'styled-components';

import {
  IconButton,
  IconListButton,
  IconListButtonOption,
  TextTooltip,
} from 'app/components/library';
import { Item } from 'network/shapes';

export const LineItem = ({
  options,
  selected,
  amt,
  setAmt,
  remove,
  reverse,
}: {
  options: IconListButtonOption[];
  selected: Item;
  amt: number;
  setAmt: (e: ChangeEvent<HTMLInputElement>) => void;
  remove?: () => void;
  reverse?: boolean;
}) => {
  return (
    <Container>
      {reverse && (
        <Quantity
          width={8.1}
          type='string'
          value={amt.toLocaleString()}
          onChange={(e) => setAmt(e)}
        />
      )}
      <TextTooltip title={selected.name} text={[selected.description]}>
        <IconListButton img={selected.image} scale={2.7} options={options} searchable />
      </TextTooltip>
      {!reverse && (
        <Quantity
          width={8.1}
          type='string'
          value={amt.toLocaleString()}
          onChange={(e) => setAmt(e)}
        />
      )}
      {remove && (
        <ExitContainer>
          <IconButton text='x' onClick={remove} scale={1.8} width={1.8} />
        </ExitContainer>
      )}
    </Container>
  );
};

const Container = styled.div`
  width: 100%;
  height: 2.4vw;

  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: center;
  gap: 0.6vw;
`;

const Quantity = styled.input<{ width?: number }>`
  border: none;
  background-color: #eee;
  border: 0.15vw solid black;
  border-radius: 0.45vw;
  width: ${({ width }) => width ?? 6}vw;
  height: 100%;
  padding: 0.3vw;
  margin: 0w;
  cursor: text;

  color: black;
  font-size: 0.9vw;
  text-align: center;
  overflow: hidden;
  text-overflow: clip;
`;

const ExitContainer = styled.div`
  height: 100%;
  flex-grow: 1;
  display: flex;
  flex-flow: row nowrap;
  justify-content: center;
  align-items: center;
`;
