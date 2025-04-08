import styled from 'styled-components';

import { MUSU_INDEX } from 'constants/items';
import { ScoresFilter } from 'network/shapes/Score';
import { ActionListButton } from '../../library';

interface Props {
  filter: ScoresFilter;
  epochOptions: number[];
  setFilter: Function;
}

export const Filters = (props: Props) => {
  const TypeFilter = () => {
    const text = !!props.filter.type ? `Type: ${props.filter.type}` : 'Type';
    const types = ['FEED', 'COLLECT', 'LIQUIDATE'];
    const options = types.map((type) => {
      return {
        text: type,
        onClick: () => props.setFilter({ ...props.filter, type, index: MUSU_INDEX }),
      };
    });

    return <ActionListButton id={'type-filter'} text={text} options={options} />;
  };

  return (
    <Row>
      {/* {EpochFilter()} */}
      {TypeFilter()}
    </Row>
  );
};

const Row = styled.div`
  margin: 0.5vw 1vw;
  gap: 0.5vw;

  display: flex;
  flex-flow: row nowrap;
`;
