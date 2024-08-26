import styled from 'styled-components';

import { ActionListButton } from 'app/components/library';
import { DefaultFilters, Filter, Sort } from '../types';
import { Filter as FilterComponent } from './Filter';

interface Props {
  tab: string;
  controls: {
    filters: Filter[];
    setFilters: (filters: Filter[]) => void;
    sorts: Sort[];
    setSorts: (sort: Sort[]) => void;
    limit: number;
    setLimit: (limit: number) => void;
  };
}

export const Controls = (props: Props) => {
  const { tab, controls } = props;
  const { filters, setFilters, sorts, setSorts, limit, setLimit } = controls;

  const FilterSelector = () => {
    const currFilters = filters.map((f) => f.field);
    const unusedFilters = DefaultFilters.filter((f) => !currFilters.includes(f.field));

    return (
      <ActionListButton
        id='filters'
        text='Filters'
        options={unusedFilters.map((f) => ({
          text: f.field,
          onClick: () => setFilters([...filters, { ...f }]),
        }))}
        size='small'
      />
    );
  };

  return (
    <Container>
      {FilterSelector()}
      <Text>Filters:</Text>
      {filters.map((f) => (
        <FilterComponent
          key={f.field}
          name={f.field}
          icon={f.icon}
          min={f.min}
          max={f.max}
          actions={{
            setMin: (min: number) =>
              setFilters(filters.map((x) => (x.field === f.field ? { ...x, min } : x))),
            setMax: (max: number) =>
              setFilters(filters.map((x) => (x.field === f.field ? { ...x, max } : x))),
            remove: () => setFilters(filters.filter((x) => x.field !== f.field)),
          }}
        />
      ))}
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  height: 100%;
  width: 100%;
  padding: 0.6vw;

  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: stretch;
`;

const Pairing = styled.div`
  gap: 0.5vw;

  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;

  user-select: none;
`;

const Icon = styled.img`
  height: 1.8vw;
  image-rendering: pixelated;
`;

const Text = styled.div`
  height: 1.2vw;
  margin-top: 0.6vw;
  font-size: 1vw;
  color: #333;
`;
