import styled from 'styled-components';

import { ActionListButton } from 'app/components/library';
import { DefaultFilters, DefaultSorts, Filter, Sort } from '../types';
import { Filter as FilterComponent } from './Filter';
import { Sort as SortComponent } from './Sort';

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

  //////////////////
  // FILTERING OPS

  const FilterSelector = () => {
    const currFilters = filters.map((f) => f.field);
    const unusedFilters = DefaultFilters.filter((f) => !currFilters.includes(f.field));

    return (
      <ActionListButton
        id='filters'
        text='+filter'
        options={unusedFilters.map((f) => ({
          text: f.field,
          onClick: () => setFilters([...filters, { ...f }]),
        }))}
        size='small'
        disabled={unusedFilters.length < 1}
      />
    );
  };

  const setFilterMin = (field: string, min: number) => {
    setFilters(filters.map((x) => (x.field === field ? { ...x, min } : x)));
  };

  const setFilterMax = (field: string, max: number) => {
    setFilters(filters.map((x) => (x.field === field ? { ...x, max } : x)));
  };

  const removeFilter = (field: string) => {
    setFilters(filters.filter((x) => x.field !== field));
  };

  //////////////////
  // SORTING OPS

  const SortSelector = () => {
    const currSorts = sorts.map((s) => s.field);
    const unusedSorts = DefaultSorts.filter((s) => !currSorts.includes(s.field));

    return (
      <ActionListButton
        id='sorts'
        text='+sort'
        options={unusedSorts.map((s) => ({
          text: s.field,
          onClick: () => setSorts([...sorts, { ...s }]),
        }))}
        size='small'
        disabled={unusedSorts.length < 1}
      />
    );
  };

  const flipSort = (field: string) => {
    setSorts(
      sorts.map((x) =>
        x.field === field ? { ...x, order: x.order === 'ASC' ? 'DESC' : 'ASC' } : x
      )
    );
  };

  const removeSort = (field: string) => {
    setSorts(sorts.filter((x) => x.field !== field));
  };

  //////////////////
  // RENDER

  return (
    <Container>
      <Row>
        {SortSelector()}
        {FilterSelector()}
      </Row>
      <Section>
        {sorts.length > 0 && <Text>Sorts:</Text>}
        {sorts.map((s) => (
          <SortComponent
            key={s.field}
            name={s.field}
            icon={s.icon}
            order={s.order}
            actions={{
              flip: () => flipSort(s.field),
              remove: () => removeSort(s.field),
            }}
          />
        ))}
      </Section>
      <Section>
        {filters.length > 0 && <Text>Filters:</Text>}
        {filters.map((f) => (
          <FilterComponent
            key={f.field}
            name={f.field}
            icon={f.icon}
            min={f.min}
            max={f.max}
            actions={{
              setMin: (min: number) => setFilterMin(f.field, min),
              setMax: (max: number) => setFilterMax(f.field, max),
              remove: () => removeFilter(f.field),
            }}
          />
        ))}
      </Section>
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

  overflow-y: scroll;
`;

const Section = styled.div`
  width: 100%;
  padding: 0.6vw;

  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  align-items: stretch;
`;

const Row = styled.div`
  padding: 0 0.3vw;
  gap: 0.3vw;

  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-end;
  align-items: center;
`;

const Text = styled.div`
  height: 1.2vw;
  margin-top: 0.6vw;
  font-size: 1vw;
  color: #333;
`;
