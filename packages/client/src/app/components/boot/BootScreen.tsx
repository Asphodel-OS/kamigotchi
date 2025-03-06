import styled from 'styled-components';

import { useNetwork } from 'app/stores';
import { loadingScreens } from 'assets/images/loading';
import { ProgressBar } from '../library/base';

interface Props {
  status: string;
  progress?: number; // as percent
  isHidden?: boolean;
}

export const BootScreen = (props: Props) => {
  const { status, progress, isHidden } = props;
  const { randNum } = useNetwork();
  const bannerKeys = Object.keys(loadingScreens);
  const bannerValues = Object.values(loadingScreens);

  const getBannerIndex = () => {
    return Math.floor(randNum * bannerKeys.length);
  };

  return (
    <Container isHidden={!!isHidden}>
      <Image src={bannerValues[getBannerIndex()]} />
      <StatusContainer>
        <Status>{status}</Status>
        <BarContainer>
          <ProgressBar
            total={100}
            current={progress ?? 0}
            colors={{ background: '#bbb', progress: '#333' }}
            height={1.5}
          />
        </BarContainer>
      </StatusContainer>
      <TagContainer>
        <Tag>banner by: </Tag>
        <Tag>{bannerKeys[getBannerIndex()]}</Tag>
      </TagContainer>
    </Container>
  );
};

const Container = styled.div<{ isHidden: boolean }>`
  display: ${({ isHidden }) => (isHidden ? 'none' : 'block')};
  width: 100%;
  height: 100%;
  position: absolute;
  background-color: #000;
  align-content: center;
  align-items: center;
  justify-content: center;
  justify-items: center;
  transition: all 2s ease;
  pointer-events: all;
  z-index: 10;
  overflow: hidden;
  user-select: none;
`;

const Image = styled.img`
  transition: all 2s ease;
  height: 100%;
  width: 100%;
  align-self: right;
  user-drag: none;
`;

const StatusContainer = styled.div`
  position: absolute;
  bottom: 25vh;
  gap: 5vh;

  width: 100%;
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;
`;

const Status = styled.div`
  color: #fff;
  width: 100%;

  text-align: center;
  font-size: 2.4vh;
`;

const BarContainer = styled.div`
  width: 60%;
`;

const TagContainer = styled.div`
  position: absolute;
  bottom: 5vh;
  left: 5vw;
  width: 100%;
`;

const Tag = styled.div`
  color: #fff;
  text-align: left;
  font-size: 1.8vh;
  line-height: 2.4vh;
`;
