import { Tooltip } from 'app/components/library';
import styled from 'styled-components';

interface Props {
  progress: number;
}

export const Bar = (props: Props) => {
  const { progress } = props;

  return (
    <Tooltip text={[`${progress}%`]}>
      <MyBar>
        <Progress width={progress} />
      </MyBar>
    </Tooltip>
  );
};

const MyBar = styled.div`
  background-color: #f0f0f0;
  border: 0.15vw solid #c2c0bf;
  height: 1vw;
  padding: 0.1vw;
  border-radius: 0.3vw;
  margin-left: -0.4vw;
  width: 30vw;
`;

const Progress = styled.div<{ width: number }>`
  width: ${({ width }) => width}%;
  height: 100%;
  border-radius: 3vw;
  transition: width 0.3s ease;
  background: repeating-linear-gradient(
    125deg,
    #98cd8d 0.01vw,
    #f6f0cf 0.01vw,
    #f6f0cf 0.05vw,
    #98cd8d 0.05vw,
    #98cd8d 0.2vw,
    #f6f0cf 0.2vw,
    #f6f0cf 0.3vw
  );
`;
