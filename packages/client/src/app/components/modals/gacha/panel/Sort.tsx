import styled from 'styled-components';

import { IconButton } from 'app/components/library';

interface Props {
  name: string;
  icon: string;
  ascending: boolean;
  actions: {
    flip: () => void;
  };
}

export const Sort = (props: Props) => {
  const { name, icon, ascending, actions } = props;
  const { flip } = actions;

  const getLabel = () => {
    if (ascending) return name + ' ↑';
    else return name + ' ↓';
  };

  return (
    <Container>
      <IconButton img={icon} onClick={flip} text={getLabel()} size={2} noMargin />
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  margin: 0.1vw;
`;
