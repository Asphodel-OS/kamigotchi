import { Overlay } from 'app/components/library';
import { PresaleData } from 'network/chain';
import styled from 'styled-components';

interface Props {
  data: PresaleData;
}

export const Footer = (props: Props) => {
  const { data } = props;

  const openBaselineDocs = () => {
    window.open('https://www.baseline.markets/', '_blank');
  };

  const getPercent = () => {
    return (100 * data.totalDeposits) / data.depositCap;
  };

  return (
    <Container>
      <Overlay left={0.75} top={-1.1}>
        <Text size={0.6} onClick={openBaselineDocs}>
          Powered by Baseline
        </Text>
      </Overlay>
      <Bar percent={getPercent()} bgColor='#182630' fgColor='#d0fe41' />
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  border-radius: 0 0 0.45vw 0.45vw;
  width: 100%;
`;

const Text = styled.div<{ size: number }>`
  font-size: ${(props) => props.size}vw;
  line-height: ${(props) => props.size * 1.5}vw;
  cursor: pointer;
  &:hover {
    opacity: 0.8;
  }
  &:active {
    opacity: 0.6;
  }
`;

interface BarProps {
  percent: number;
  bgColor: string;
  fgColor: string;
}

const Bar = styled.div<BarProps>`
  position: relative;
  height: 4.2vh;

  background: ${({ percent, bgColor, fgColor }) =>
    `linear-gradient(90deg, ${fgColor}, 0%, ${fgColor}, ${percent}%, ${bgColor}, ${percent}%, ${bgColor} 100%)`};

  display: flex;
  align-items: center;
`;
