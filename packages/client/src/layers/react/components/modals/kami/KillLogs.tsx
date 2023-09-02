import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import {
  Table,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';

import { Kill } from 'layers/react/shapes/Kill';
import { dataStore } from 'layers/react/store/createStore';
import { Kami } from 'layers/react/shapes/Kami';


interface Props {
  kami: Kami;
}

// Rendering of the Kami's Kill/Death Logs
export const KillLogs = (props: Props) => {
  const { selectedEntities, setSelectedEntities } = dataStore();
  const cellStyle = { fontFamily: 'Pixel', fontWeight: 12, border: 0 };

  let logs = props.kami.kills!.concat(props.kami.deaths!);
  logs = logs.sort((a, b) => b.time - a.time);

  const Row = (log: Kill, index: number) => {
    const type = log.source?.index === undefined ? 'kill' : 'death';
    const subject = log.source?.index === undefined ? log.target : log.source;
    const date = new Date(log.time * 1000);
    const dateString = date.toLocaleString(
      'default',
      {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
      }
    );

    return (
      <TableRow key={index}>
        <TableCell sx={cellStyle}>{dateString}</TableCell>
        <TableCell sx={cellStyle}>{type}</TableCell>
        <TableCell
          sx={{ ...cellStyle, cursor: 'pointer' }}
          onClick={() => setSelectedEntities({ ...selectedEntities, kami: subject?.entityIndex! })}
        >
          {subject?.name}
        </TableCell>
        <TableCell sx={cellStyle}>{log.node.name}</TableCell>
      </TableRow>
    );
  };

  return (
    <Container style={{ overflowY: 'scroll' }}>
      <Title>Kill/Death Logs</Title>
      <TableContainer>
        <Table>
          <TableHead>{logs.map((log, index) => Row(log, index))}</TableHead>
        </Table>
      </TableContainer>
    </Container>
  );
}

const Container = styled.div`
  border: solid black .15vw;
  border-radius: .5vw;
  margin: .7vw;
  padding: .7vw;

  display: flex;
  flex-flow: column nowrap;
`;

const Title = styled.div`
  padding: .5vw;  
  color: black;
  font-family: Pixel;
  font-size: 2vw;
`;