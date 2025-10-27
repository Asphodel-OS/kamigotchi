import { useEffect } from 'react';
import styled from 'styled-components';

import { Text } from 'app/components/library';
import { EntityIndex } from 'engine/recs';
import { NetworkLayer } from 'network/';
import { Log } from './Log';

export const Logs = ({
  network,
  actionIndices,
  state,
  utils,
  isVisible,
}: {
  network: NetworkLayer;
  actionIndices: EntityIndex[];
  state: { tick: number };
  utils: {
    cancelRequest: (entity: EntityIndex) => Promise<void>;
    cancelPendingTx: (hash: string) => Promise<void>;
  };
  isVisible: boolean;
}) => {
  // scroll to bottom when tx added
  useEffect(() => {
    const logsElement = document.getElementById('tx-logs');
    if (logsElement) logsElement.scrollTop = logsElement.scrollHeight;
  }, [actionIndices]);

  /////////////////
  // RENDER

  return (
    <Container id='tx-logs' style={{ display: isVisible ? 'block' : 'none' }}>
      <Header>
        <Bar />
        <Text size={0.6}>TxQueue</Text>
        <Bar />
      </Header>
      {actionIndices.map((entity) => {
        return <Log key={entity} network={network} entity={entity} state={state} utils={utils} />;
      })}
    </Container>
  );
};

const Container = styled.div`
  border: solid grey 0.15vw;
  border-radius: 0.45vw;

  background-color: #ddd;
  margin: 0.2vw;
  padding: 0.2vw;
  overflow-y: auto;

  display: flex;
  flex-direction: column;
  flex-grow: 1;
`;

const Header = styled.div`
  padding: 0.3vw;

  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: space-evenly;
`;

const Bar = styled.div`
  border-top: 0.1vw solid #888;
  width: 40%;
  padding: 0.1vw;
`;
