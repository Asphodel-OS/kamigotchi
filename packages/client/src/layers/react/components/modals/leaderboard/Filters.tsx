import React from 'react';
import styled from 'styled-components';

import { ActionListButton } from '../../library/ActionListButton';
import { ScoresFilter } from 'layers/network/shapes/Score';


interface Props {
  filter: ScoresFilter;
  epochOptions: number[];
  setFilter: Function;
};

export const Filters = (props: Props) => {

  const EpochFilter = () => {
    const text = (!!props.filter.epoch) ? `Epoch: ${props.filter.epoch * 1}` : 'Epoch';
    const epochsSorted = props.epochOptions.sort((a, b) => b - a);
    const options = epochsSorted.map((epoch: number) => {
      return {
        text: (epoch * 1).toString(),
        onClick: () => props.setFilter({ ...props.filter, epoch }),
      };
    });

    return (
      <ActionListButton
        id={'epoch-props.filter'}
        text={text}
        options={options}
      />
    );
  }

  const TypeFilter = () => {
    const text = (!!props.filter.type) ? `Type: ${props.filter.type}` : 'Type';
    const types = ['FEED', 'COLLECT', 'LIQUIDATE'];
    const options = types.map((type) => {
      return {
        text: type,
        onClick: () => props.setFilter({ ...props.filter, type }),
      };
    });

    return (
      <ActionListButton
        id={'type-filter'}
        text={text}
        options={options}
      />
    );
  }

  return <Row>{EpochFilter()}{TypeFilter()}</Row>;
};


const Row = styled.div`
  margin: .5vw 1vw;
  gap: .5vw;

  display: flex;
  flex-flow: row nowrap;
`;



