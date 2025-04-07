import styled from 'styled-components';

import { ActionListButton, CircleExitButton, EmptyText } from 'app/components/library';
import { DefaultFilters, DefaultSorts, Filter, Sort } from '../../../types';
import { Filter as FilterComponent, Sort as SortComponent } from './components';

interface Props {
  controls: {
    filters: Filter[];
    setFilters: (filters: Filter[]) => void;
    sorts: Sort[];
    setSorts: (sort: Sort[]) => void;
  };
  isVisible: boolean;
}

export const KamiPanel = (props: Props) => {
  const { controls, isVisible } = props;
  const { filters, setFilters, sorts, setSorts } = controls;

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
          image: f.icon,
          onClick: () => setFilters([...filters, { ...f }]),
        }))}
        size='small'
        disabled={unusedFilters.length < 1}
        persist
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
          image: s.icon,
          onClick: () => setSorts([...sorts, { ...s }]),
        }))}
        size='small'
        disabled={unusedSorts.length < 1}
        persist
      />
    );
  };

  // flip's a sort field's ordering
  const flipSort = (field: string) => {
    setSorts(sorts.map((x) => (x.field === field ? { ...x, ascending: !x.ascending } : x)));
  };

  // unused atm
  const removeSort = (field: string) => {
    setSorts(sorts.filter((x) => x.field !== field));
  };

  const getEmptyText = () => {
    const text = ['Do you seek..'];
    const options = [
      'more power?',
      'more health?',
      'more violence?',
      'more harmony?',
      'more slots?',
    ];
    const chosenIndex = Math.floor(Math.random() * options.length);
    return text.concat(options[chosenIndex]);
  };

  //////////////////
  // RENDER

  return (
    <Container isVisible={isVisible}>
      <Row>
        {SortSelector()}
        {FilterSelector()}
      </Row>
      {sorts.length < 1 && filters.length < 1 && <EmptyText text={getEmptyText()} />}
      <Section>
        {sorts.length > 0 && (
          <Row>
            <Text>Sorts:</Text>
            <CircleExitButton onClick={() => setSorts([])} circle />
          </Row>
        )}
        <Row>
          {sorts.map((s) => (
            <SortComponent
              key={s.field}
              name={s.field}
              icon={s.icon}
              ascending={s.ascending}
              actions={{
                flip: () => flipSort(s.field),
              }}
            />
          ))}
        </Row>
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

const Container = styled.div<{ isVisible: boolean }>`
  position: relative;
  height: 100%;
  width: 100%;
  padding: 0.6vw;

  display: ${({ isVisible }) => (isVisible ? 'flex' : 'none')};
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
  flex-flow: row wrap;
  justify-content: flex-start;
  align-items: center;
`;

const Text = styled.div`
  height: 1.2vw;
  margin-top: 0.6vw;
  font-size: 1vw;
  color: #333;
`;
