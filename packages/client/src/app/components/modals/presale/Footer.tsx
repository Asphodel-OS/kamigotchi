import { Overlay, TextTooltip } from 'app/components/library';
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

  const getSupplyMinted = () => {
    return (data.totalDeposits / data.price).toLocaleString();
  };

  const getTotalSupply = () => {
    return (data.depositCap / data.price).toLocaleString();
  };

  return (
    <Container>
      <Overlay left={0.75} top={-1.1}>
        <TextTooltip
          text={[
            '$ONYX is a bToken based on the Baseline Protocol.',
            '',
            'Click to learn more about Baseline Markets!',
          ]}
          alignText='center'
          grow
        >
          <Text size={0.6} onClick={openBaselineDocs}>
            Powered by Baseline
          </Text>
        </TextTooltip>
      </Overlay>
      <TextTooltip text={[`${getSupplyMinted()} / ${getTotalSupply()} $ONYX claimed`]}>
        <Bar percent={getPercent()} bgColor='#112535' fgColor='#d0fe41' />
      </TextTooltip>
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  border-radius: 0 0 0.45vw 0.45vw;
  width: 100%;
`;

const Text = styled.div<{ size: number }>`
  color: #d0fe41;
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
  border-radius: 0 0 1.05vw 1.2vw;
  height: 4.2vh;

  background: ${({ percent, bgColor, fgColor }) =>
    `linear-gradient(90deg, ${fgColor}, 0%, ${fgColor}, ${percent * 0.9}%, ${bgColor}, ${Math.min(percent * 1.1, 100)}%, ${bgColor} 100%)`};

  display: flex;
  align-items: center;
`;
