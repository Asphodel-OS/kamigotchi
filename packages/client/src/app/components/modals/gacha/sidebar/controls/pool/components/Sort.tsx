import styled from 'styled-components';

import { IconButton } from 'app/components/library';

export const Sort = ({
  name,
  icon,
  ascending,
  actions,
}: {
  name: string;
  icon: string;
  ascending: boolean;
  actions: {
    flip: () => void;
  };
}) => {
  const { flip } = actions;

  const getLabel = () => {
    if (ascending) return name + ' ↑';
    else return name + ' ↓';
  };

  return (
    <Container>
      <IconButton img={icon} onClick={flip} text={getLabel()} scale={2} />
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  margin: 0.1em;
`;
