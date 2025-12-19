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
}: {
  network: NetworkLayer;
  actionIndices: EntityIndex[];
  state: { tick: number };
  utils: {
    cancelRequest: (entity: EntityIndex) => Promise<void>;
    cancelPendingTx: (hash: string) => Promise<void>;
  };
}) => {
  // scroll to bottom when tx added
  useEffect(() => {
    const logsElement = document.getElementById('tx-logs');
    if (logsElement) logsElement.scrollTop = logsElement.scrollHeight;
  }, [actionIndices]);

  /////////////////
  // RENDER

  return (
    <Container id='tx-logs'>
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
  border: solid grey 0.15em;
  border-radius: 0.45em;

  background-color: #ddd;
  margin: 0.2em;
  padding: 0.2em;
  overflow-y: auto;

  display: flex;
  flex-direction: column;
  flex-grow: 1;
`;

const Header = styled.div`
  padding: 0.3em;

  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: space-evenly;
`;

const Bar = styled.div`
  border-top: 0.1em solid #888;
  width: 40%;
  padding: 0.1em;
`;
