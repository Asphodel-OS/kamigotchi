import styled from 'styled-components';
import { TabType } from './types';

interface Props {
  tab: TabType;
  setTab: (tab: TabType) => void;
}

export const Tabs = (props: Props) => {
  const { tab, setTab } = props;
  return (
    <Buttons>
      <Button
        disabled={tab === `ActiveOffers`}
        onClick={() => {
          setTab(`ActiveOffers`);
        }}
      >
        {`Active Offers`}
      </Button>
      <Button
        disabled={tab === `ManagementTab`}
        onClick={() => {
          setTab(`ManagementTab`);
        }}
      >
        {`Management Tab`}
      </Button>
    </Buttons>
  );
};

const Buttons = styled.div`
  left: 0;
  top: 0;
  position: absolute;
  width: 100%;
  display: flex;
  margin-bottom: 1vw;
`;

const Button = styled.button`
  font-size: 1vw;
  padding: 0.4vw;
  padding-right: 2vw;
  padding-left: 2vw;
  border-radius: 0 0 0.8vw 0.8vw;
  border-top: 0;
  z-index: 1;
  width: 50%;
  background-color: #c5c5c5;
  &:hover {
    cursor: pointer;
  }
  &: disabled {
    background-color: rgb(255, 255, 255);
    z-index: 2;
    border-color: black;
    cursor: default;
  }
`;
