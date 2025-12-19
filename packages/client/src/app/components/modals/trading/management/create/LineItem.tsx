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
  iconOnly,
}: {
  options: IconListButtonOption[];
  selected: Item;
  amt: number;
  setAmt: (e: ChangeEvent<HTMLInputElement>) => void;
  remove?: () => void;
  reverse?: boolean;
  iconOnly?: boolean;
}) => {
  return (
    <Container>
      {reverse && (
        <Quantity
          width={8.1}
          type='text'
          inputMode='numeric'
          pattern='[0-9]*'
          value={amt.toLocaleString()}
          onChange={(e) => setAmt(e)}
        />
      )}
      <TextTooltip title={selected.name} text={[selected.description]}>
        {iconOnly ? (
          selected.image && <IconImage src={selected.image} />
        ) : (
          <IconListButton
            img={selected.image}
            scaleRelativeToRoot={2.7}
            options={options}
            searchable
            tooltip={{ text: [selected.description] }}
          />
        )}
      </TextTooltip>
      {!reverse && (
        <Quantity
          width={8.1}
          type='text'
          inputMode='numeric'
          pattern='[0-9]*'
          value={amt.toLocaleString()}
          onChange={(e) => setAmt(e)}
        />
      )}
      {remove && (
        <ExitContainer>
          <IconButton text='x' onClick={remove} scaleRelativeToRoot={1.8} width={1.8} />
        </ExitContainer>
      )}
    </Container>
  );
};

const Container = styled.div`
  width: 100%;
  height: 2.4em;

  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: center;
  gap: 0.6em;
`;

const Quantity = styled.input<{ width?: number }>`
  border: none;
  background-color: #eee;
  border: 0.15em solid black;
  border-radius: 0.45em;
  width: ${({ width }) => width ?? 6}em;
  height: 100%;
  padding: 0.3em;
  margin: 0w;
  cursor: text;

  color: black;
  font-size: 0.9em;
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

const IconImage = styled.img`
  width: 2.7em;
  height: 2.7em;
  image-rendering: pixelated;
`;
