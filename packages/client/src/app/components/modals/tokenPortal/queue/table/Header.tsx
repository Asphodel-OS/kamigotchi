import styled from 'styled-components';

import { Text } from 'app/components/library';
import { playClick } from 'utils/sounds';
import { Column, ColumnWidths, Sort, Sortable, SORTABLE } from './constants';

export const Header = ({
  columns,
  state,
  data,
}: {
  columns: ColumnWidths;
  state: {
    sort: Sort;
    setSort: (sort: Sort) => void;
  };
  data: { mode: string };
}) => {
  const { sort, setSort } = state;
  const { mode } = data;
  /////////////////
  // INTERACTION

  // handle sorting updates when a column is clicked
  const labelOnClick = (key: Column) => {
    if (!SORTABLE.includes(key as Sortable)) return;
    if (sort.key === key) setSort({ key, reverse: !sort.reverse });
    else setSort({ key: key as Sortable, reverse: false });
    playClick();
  };

  const showColumn = (col: string) => {
    return (
      (col != 'Account' && mode === 'MINE') ||
      (col != 'Type' && col != 'Actions' && mode === 'OTHERS')
    );
  };
  /////////////////
  // DISPLAY

  return (
    <Container>
      {Object.entries(columns).map(([col, width]) => {
        return (
          <Label key={col} width={width} visible={showColumn(col)}>
            <Text size={0.75} onClick={() => labelOnClick(col as Column)}>
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
  height: 2.7vw;

  padding: 0.6vw;
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-evenly;
  align-items: center;

  color: black;
  font-size: 0.9vw;
  text-align: left;

  opacity: 0.9;
  z-index: 1;
`;

const Label = styled.div<{ width: number; visible: boolean }>`
  position: relative;
  padding: 0.6vw;
  width: ${({ width }) => width}vw;

  display: ${({ visible = true }) => (visible ? 'flex' : 'none')};
  flex-flow: row nowrap;
  justify-content: center;
  align-items: center;
`;
