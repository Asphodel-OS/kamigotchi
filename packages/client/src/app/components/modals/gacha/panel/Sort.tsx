import styled from 'styled-components';

import { ActionButton, CircleExitButton, Overlay } from 'app/components/library';

interface Props {
  name: string;
  icon: string;
  order: string;
  actions: {
    flip: () => void;
    remove: () => void;
  };
}

export const Sort = (props: Props) => {
  const { name, icon, order, actions } = props;
  const { flip, remove } = actions;

  return (
    <Container>
      <Overlay top={-0.4} right={-0.4}>
        <CircleExitButton onClick={remove} circle />
      </Overlay>
      <Grouping>
        <Icon src={icon} />
        <Text size={0.9}>{name}</Text>
      </Grouping>
      <Grouping>
        <ActionButton onClick={flip} text={order === 'ASC' ? '↑' : '↓'} />
      </Grouping>
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  border: solid black 0.15vw;
  border-radius: 0.6vw;
  padding: 0.6vw;
  margin: 0.3vw;

  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  align-items: flex-start;
`;

const Grouping = styled.div`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  gap: 0.6vw;
`;

const Icon = styled.img`
  height: 1.8vw;
  width: 1.8vw;
`;

const Text = styled.div<{ size: number }>`
  font-size: ${({ size }) => size}vw;
  color: #333;
`;
