import styled from 'styled-components';

import { ActionListButton, Tooltip } from 'app/components/library';
import { Overlay } from 'app/components/library/styles';
import { BaseKami } from 'network/shapes/Kami/types';
import { GachaTicket } from 'network/shapes/utils';
import { DefaultFilters, Filter, Sort, TabType } from '../types';
import { Filter as FilterComponent } from './Filter';
import { Footer } from './Footer';
import { Tabs } from './Tabs';

interface Props {
  tab: TabType;
  setTab: (tab: TabType) => void;
  gachaBalance: number;
  actions: {
    mint: (balance: number) => Promise<void>;
    reroll: (kamis: BaseKami[], price: bigint) => () => Promise<void>;
  };
  controls: {
    filters: Filter[];
    setFilters: (filters: Filter[]) => void;
    sorts: Sort[];
    setSorts: (sort: Sort[]) => void;
    limit: number;
    setLimit: (limit: number) => void;
  };
}

export const Panel = (props: Props) => {
  const { actions, gachaBalance, controls } = props;
  const { filters, setFilters, sorts, setSorts, limit, setLimit } = controls;

  const FilterSelector = () => {
    const { filters, setFilters } = props.controls;
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
      <Tabs tab={props.tab} setTab={props.setTab} />
      <Controls>
        {/* <EmptyText text={['Filters coming soon™']} size={1} /> */}

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
        <Overlay right={0.75} bottom={0.3}>
          <Pairing>
            <Text>{gachaBalance.toFixed(1)}</Text>
            <Tooltip text={[GachaTicket.name]}>
              <Icon src={GachaTicket.image} />
            </Tooltip>
          </Pairing>
        </Overlay>
      </Controls>
      <Footer tab={props.tab} actions={actions} balance={gachaBalance} />
    </Container>
  );
};

const Container = styled.div`
  border-left: solid black 0.15vw;
  height: 100%;

  display: flex;
  flex-flow: column nowrap;
  justify-content: space-between;
  align-items: flex-start;
`;

const Controls = styled.div`
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
