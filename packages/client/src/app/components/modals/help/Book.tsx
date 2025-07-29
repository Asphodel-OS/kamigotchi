import styled from 'styled-components';

import { clickFx, hoverFx } from 'app/styles/effects';
import { playClick } from 'utils/sounds';
import { CopyInfo } from './copy';

// ActionButton is a text button that triggers an Action when clicked
export const Book = ({
  infoKey,
  setTab,
}: {
  infoKey: keyof typeof CopyInfo
  setTab: Function
}) => {
  const details = CopyInfo[infoKey];

  // layer on a sound effect
  const handleClick = async () => {
    playClick();
    setTab(infoKey);
  };

  return (
    <Container onClick={handleClick}>
      <Image src={details.menuIcon} />
      <Title>{details.title}</Title>
    </Container>
  );
};

const Container = styled.div`
  border: solid 0.15vw black;
  border-radius: 1vw;
  width: 8vw;
  height: 10vw;
  padding: 0.9vw;
  gap: 0.6vw;
  box-shadow: 0 0 1vw 0 rgba(0, 0, 0, 0.5);

  display: flex;
  flex-flow: column nowrap;
  justify-content: space-between;
  align-items: center;

  pointer-events: auto;
  cursor: pointer;
  &:hover {
    animation: ${() => hoverFx()} 0.2s;
    transform: scale(1.05);
  }
  &:active {
    animation: ${() => clickFx()} 0.3s;
  }
`;

const Image = styled.img`
  width: 90%;
`;

const Title = styled.div`
  color: black;
  font-size: 0.6vw;
  line-height: 0.8vw;
  text-align: center;
`;
