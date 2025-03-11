import styled from 'styled-components';

import { Tooltip } from 'app/components/library';

interface Props {
  quantityLeft: number;
  quantityRight: number;
}

export const Rate = (props: Props) => {
  const { quantityLeft, quantityRight } = props;
  return (
    <Content>
      <Tooltip text={[quantityLeft.toString()]}>
        <Column>
          Ether
          <Numbers>{quantityLeft}</Numbers>
        </Column>
      </Tooltip>
      <Arrow />
      <Tooltip text={[quantityRight.toString()]}>
        <Column>
          Onyx
          <Numbers>{quantityRight}</Numbers>
        </Column>
      </Tooltip>
    </Content>
  );
};

const Content = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  font-size: 1vw;
`;

const Arrow = styled.div`
  border: solid black;
  border-width: 0 0.2vw 0.2vw 0;
  display: inline-block;
  padding: 0.8vw;
  transform: rotate(-45deg);
  -webkit-transform: rotate(-45deg);
  margin-right: 1vw;
`;

const Column = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 9ch;
`;

const Numbers = styled.div`
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  max-width: 9ch;
  margin: 1vw 1vw 0.8vw 1vw;
  line-height: 1.2vw;
`;
