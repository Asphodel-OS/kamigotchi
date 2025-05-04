import styled from 'styled-components';

type Props = {
  max: number;
  current: number;
  color?: string;
  indicator?: boolean;
  leftText?: string;
  rightText?: string;
  width?: number; // a percentage
};

export const ProgressBar = (props: Props) => {
  const progress = ((props.current / props.max) * 100).toFixed(1) + '%';
  const innerStyles = {
    backgroundColor: props.color ? props.color : '#3DE167',
    width: progress,
  };
  const indicatorPos = (props.current / props.max) * 100 < 2.5 ? '2.5%' : progress;

  const bar = (
    <OuterBar style={{ width: props.width ? props.width + '%' : '100%' }}>
      <InnerBar style={innerStyles} />
    </OuterBar>
  );

  return (
    <Container style={{ width: props.width ? props.width + '%' : '100%' }}>
      {props.indicator && (
        <Row style={{ width: props.width ? props.width + '%' : '100%' }}>
          <>-</>
          <IndicatorText style={{ left: indicatorPos }}>{progress}</IndicatorText>
        </Row>
      )}
      {bar}
      <Row>
        <EdgeText>{props.leftText}</EdgeText>
        <EdgeText>{props.rightText}</EdgeText>
      </Row>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;

  margin: 0vh 0.75vw;
`;

const EdgeText = styled.p`
  font-family: Pixel;
  font-size: 0.8vw;
  color: #666;
`;

const IndicatorText = styled.p`
  position: absolute;
  left: 50%;
  bottom: -0.6vw;
  transform: translateX(-50%);

  font-family: Pixel;
  font-size: 0.8vw;
  color: #666;

  padding: 1.5vh;
`;

const InnerBar = styled.div`
  border-radius: 0.7vw;
`;

const OuterBar = styled.div`
  border-radius: 1vw;
  border: 0.15vw solid #444;
  width: 100%;
  height: 4vh;
  padding: 0.2vw;

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
  padding: 0.75vh 0vw;
`;
