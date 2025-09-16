import moment from 'moment';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { TextTooltip } from 'app/components/library';
import { KAMI_BASE_URI } from 'constants/media';
import { Account } from 'network/shapes/Account';

interface Props {
  account: Account;
  isLoading: boolean;
}

export const Pfp = (props: Props) => {
  const { account, isLoading } = props;
  const [tick, setTick] = useState(Date.now());
  
  useEffect(() => {
    const refreshClock = () => setTick(Date.now());
    const timerId = setInterval(refreshClock, 3333);
    return () => clearInterval(timerId);
  }, []);

  const getLastSeenString = () => {
    return `Last Seen: ${moment(1000 * account.time.last).fromNow()}`;
  };

  return (
    <PfpContainer>
      <PfpImage
        isLoading={isLoading}
        draggable='false'
        src={`${KAMI_BASE_URI + account.pfpURI}.gif`}
      />
      <TextTooltip text={[getLastSeenString()]}>
        <PfpStatus isLoading={isLoading} timeDelta={tick / 1000 - account.time.last} />
      </TextTooltip>
    </PfpContainer>
  );
};

const PfpContainer = styled.div`
  position: relative;
  width: 10rem;
  height: 10rem;
`;

const PfpImage = styled.img<{ isLoading: boolean }>`
  border: solid black 0.15rem;
  border-radius: 10rem;
  width: 10rem;
  height: 10rem;
  object-fit: cover;
  object-position: 100% 0;
  opacity: 1;
  ${({ isLoading }) =>
    isLoading &&
    `animation: fade 3s linear infinite;
    z-index: 1;
    @keyframes fade {
      0%,
      100% {
        opacity: 0.4;
      }
      50% {
        opacity: 1;
      }
    }`}
`;

const PfpStatus = styled.div<{ timeDelta: number; isLoading: boolean }>`
  border: solid 0.2rem white;
  position: absolute;
  bottom: 0.9rem;
  right: 0.9rem;
  width: 1.2rem;
  height: 1.2rem;
  border-radius: 3rem;
  z-index: 1;
  background-color: ${(props) => {
    if (props.timeDelta < 300) return '#6f3';
    else if (props.timeDelta < 1800) return '#fd3';
    else return '#f33';
  }};
  ${({ isLoading }) =>
    isLoading &&
    `animation: fade 3s linear infinite;
    z-index: 1;
    @keyframes fade {
      0%,
      100% {
        opacity: 0.4;
      }
      50% {
        opacity: 1;
      }
    }`}
`;