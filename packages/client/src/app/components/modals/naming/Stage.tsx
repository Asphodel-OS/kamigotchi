import { EntityID } from '@mud-classic/recs';
import { KamiBlock, Text } from 'app/components/library';
import { Account } from 'network/shapes/Account';
import { Kami } from 'network/shapes/Kami';
import styled from 'styled-components';

interface Props {
  actions: {
    onyxApprove: (price: number) => EntityID | void;
    onyxRename: (kami: Kami, name: string) => EntityID;
    rename: (kami: Kami, name: string) => EntityID;
  };
  data: {
    account: Account;
    kami: Kami;
  };
}

export const Stage = (props: Props) => {
  const { actions, data } = props;
  const { account, kami } = data;

  const handleRename = () => {
    actions.rename(kami, '');
  };

  return (
    <Container>
      <Text size={1.8}>Rename {kami.name}</Text>
      <Text size={1.2}>Choose wisely.</Text>
      <KamiBlock kami={kami} />
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  border: solid black 0.15vw;
  border-radius: 1.2vw;
  padding: 1.2vw;
  margin: 0.9vw;
  background-color: #fff;

  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  align-items: flex-start;

  user-select: none;
`;
