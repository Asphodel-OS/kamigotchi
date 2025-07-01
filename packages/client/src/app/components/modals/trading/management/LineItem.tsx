import { ChangeEvent } from 'react';
import styled from 'styled-components';

import {
  IconButton,
  IconListButton,
  IconListButtonOption,
  TextTooltip,
} from 'app/components/library';
import { Item } from 'network/shapes';

interface Props {
  options: IconListButtonOption[];
  selected: Item;
  amt: number;
  setAmt: (e: ChangeEvent<HTMLInputElement>) => void;
  remove: () => void;
}

export const LineItem = (props: Props) => {
  const { options, selected, amt, setAmt, remove } = props;

  return (
    <Container>
      <TextTooltip title={selected.name} text={[selected.description]}>
        <IconListButton img={selected.image} scale={2.7} options={options} />
      </TextTooltip>
      <Quantity
        width={16.2}
        type='string'
        value={amt.toLocaleString()}
        onChange={(e) => setAmt(e)}
      />
      <ExitContainer>
        <IconButton text='x' onClick={remove} scale={1.8} width={1.8} />
      </ExitContainer>
    </Container>
  );
};

const Container = styled.div`
  width: 100%;

  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: flex-start;
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
`;

const ExitContainer = styled.div`
  height: 100%;
  flex-grow: 1;
  display: flex;
  flex-flow: row nowrap;
  justify-content: center;
  align-items: center;
`;
