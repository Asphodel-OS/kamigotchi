import styled from 'styled-components';

import { MUSU_INDEX } from 'constants/items';
import { ScoresFilter } from 'network/shapes/Score';
import { ActionListButton } from '../../library';

export const Filters = ({
  filter,
  epochOptions,
  setFilter,
}: {
  filter: ScoresFilter;
  epochOptions: number[];
  setFilter: Function;
}) => {
  const TypeFilter = () => {
    const text = !!filter.type ? `Type: ${filter.type}` : 'Type';
    const types = ['FEED', 'COLLECT', 'LIQUIDATE'];
    const options = types.map((type) => {
      return {
        text: type,
        onClick: () => setFilter({ ...filter, type, index: MUSU_INDEX }),
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
