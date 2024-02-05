import styled from "styled-components";

import { Kamis } from "./party/Kamis";
import { Account } from "layers/network/shapes/Account";
import { Kami } from "layers/network/shapes/Kami";
import { Friends } from "./friends/Friends";
import { Friendship } from "layers/network/shapes/Friendship";



interface Props {
  tab: string;
  data: { account: Account; }
  actions: {
    acceptFren: (account: Account) => void;
    blockFren: (account: Account) => void;
    cancelFren: (friendship: Friendship) => void;
    requestFren: (account: Account) => void;
  }
}

export const Bottom = (props: Props) => {
  const { tab, data, actions } = props;

  const RenderedTab = () => {
    if (tab === 'party') return <Kamis kamis={data.account.kamis ?? []} />
    if (tab === 'frens') return (
      <Friends
        friendships={data.account.friends?.friends ?? []}
        actions={{
          blockFren: actions.blockFren,
          removeFren: actions.cancelFren,
        }}
      />
    );
    if (tab === 'activity') return <Kamis kamis={data.account.kamis ?? []} />
    else return <div style={{ color: 'black' }}>Not implemented yet</div>
  }

  return (
    <Container>
      <RenderedTab />
    </Container>
  );
}

const Container = styled.div`
  border: solid .15vw black;
  border-radius: 0 0 .3vw .3vw;
  width: 100%;
  height: 100%;
  background-color: white;
  padding: 1vw;

  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  align-items: center;
  
  overflow-y: scroll;
`;