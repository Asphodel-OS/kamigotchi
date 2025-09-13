import styled from 'styled-components';

import { Text } from 'app/components/library';
import { playClick } from 'utils/sounds';
import { Column, COLUMNS, Sort, Sortable, SORTABLE } from './constants';

export const Header = ({
  state,
}: {
  state: {
    sort: Sort;
    setSort: (sort: Sort) => void;
  };
}) => {
  const { sort, setSort } = state;

  /////////////////
  // INTERACTION

  // handle sorting updates when a column is clicked
  const labelOnClick = (key: Column) => {
    if (!SORTABLE.includes(key as Sortable)) return;
    if (sort.key === key) setSort({ key, reverse: !sort.reverse });
    else setSort({ key: key as Sortable, reverse: false });
    playClick();
  };

  /////////////////
  // DISPLAY

  return (
    <Container>
      {COLUMNS.map((col, i) => {
        return (
          <Label key={i}>
            <Text size={0.9} onClick={() => labelOnClick(col)}>
              {col}
            </Text>
            {sort.key === col && <Text size={0.9}>{sort.reverse ? '↑' : '↓'}</Text>}
          </Label>
        );
      })}
    </Container>
  );
};

const Container = styled.div`
  position: sticky;
  top: 0;
  background-color: rgb(221, 221, 221);
  width: 100%;
  height: 2.4vw;

  padding: 0.6vw;
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-around;
  align-items: center;

  color: black;
  font-size: 0.9vw;
  text-align: left;

  opacity: 0.9;
  z-index: 1;
`;

const Label = styled.div`
  width: 100%;
  padding: 0.6vw;

  display: flex;
  flex-flow: row nowrap;
  justify-content: space-around;
  align-items: center;
`;
