import { Tooltip } from 'app/components/library';
import styled from 'styled-components';

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
  margin: 1.5vw 0 1.5vw 0;
`;

const Arrow = styled.div`
  border: solid black;
  border-width: 0 0.2vw 0.2vw 0;
  display: inline-block;
  padding: 0.8vw;
  transform: rotate(-45deg);
  -webkit-transform: rotate(-45deg);
`;

const Column = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Numbers = styled.div`
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  max-width: 9ch;
  margin: 1vw;
  justify-content: flex-start;
  line-height: 1.2vw;
`;
