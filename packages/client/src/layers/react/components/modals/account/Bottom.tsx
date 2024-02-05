import { Account } from "layers/network/shapes/Account";
import { KamiGrid } from "./party/KamiGrid";
import { Kami } from "layers/network/shapes/Kami";
import styled from "styled-components";



interface Props {
  tab: string;
  data: { account: Account; }
  actions: {
    sendRequest: (account: Account) => void;
    acceptRequest: (request: any) => void;
  }
}

export const Bottom = (props: Props) => {
  const { tab, data, actions } = props;


  const RenderedTab = () => {
    if (tab === 'party') return <KamiGrid kamis={data.account.kamis ?? []} />
    if (tab === 'frens') return <KamiGrid kamis={data.account.kamis ?? []} />
    if (tab === 'activity') return <KamiGrid kamis={data.account.kamis ?? []} />
    else return <div>Not implemented yet</div>
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