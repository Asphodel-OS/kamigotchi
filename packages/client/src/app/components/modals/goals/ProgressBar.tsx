import styled from 'styled-components';

export const ProgressBar = ({
  max,
  current,
  color,
  indicator,
  leftText,
  rightText,
  width,
}: {
  max: number;
  current: number;
  color?: string;
  indicator?: boolean;
  leftText?: string;
  rightText?: string;
  width?: number; // a percentage
}) => {
  const progress = ((current / max) * 100).toFixed(1) + '%';
  const innerStyles = {
    backgroundColor: color ? color : '#3DE167',
    width: progress,
  };
  const indicatorPos = (current / max) * 100 < 2.5 ? '2.5%' : progress;

  const bar = (
    <OuterBar style={{ width: width ? width + '%' : '100%' }}>
      <InnerBar style={innerStyles} />
    </OuterBar>
  );

  return (
    <Container style={{ width: width ? width + '%' : '100%' }}>
      {indicator && (
        <Row style={{ width: width ? width + '%' : '100%' }}>
          <>-</>
          <IndicatorText style={{ left: indicatorPos }}>{progress}</IndicatorText>
        </Row>
      )}
      {bar}
      <Row>
        <EdgeText>{leftText}</EdgeText>
        <EdgeText>{rightText}</EdgeText>
      </Row>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;

  margin: 0em 0.75em;
`;

const EdgeText = styled.p`
  font-family: Pixel;
  font-size: 0.8em;
  color: #666;
`;

const IndicatorText = styled.p`
  position: absolute;
  left: 50%;
  bottom: -0.6em;
  transform: translateX(-50%);

  font-family: Pixel;
  font-size: 0.8em;
  color: #666;

  padding: 1.5em;
`;

const InnerBar = styled.div`
  border-radius: 0.7em;
`;

const OuterBar = styled.div`
  border-radius: 1em;
  border: 0.15em solid #444;
  width: 100%;
  height: 4em;
  padding: 0.2em;

  display: flex;
  flex-direction: row;
  align-items: stretch;
  justify-content: flex-start;

  overflow: hidden;
`;

const Row = styled.div`
  position: relative;

  display: flex;
  flex-direction: row;
  justify-content: space-between;

  width: 100%;
  padding: 0.75em 0em;
`;
