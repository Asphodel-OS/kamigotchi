import React from 'react';
import styled from 'styled-components';
import {
  Table,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';

import { Kill } from 'layers/react/shapes/Kill';
import { Kami } from 'layers/react/shapes/Kami/Kami';
import { useSelectedEntities } from 'layers/react/store/selectedEntities';


interface Props {
  kami: Kami;
}

// Rendering of the Kami's Kill/Death Logs
export const KillLogs = (props: Props) => {
  const { setKami } = useSelectedEntities();
  const cellStyle = { fontFamily: 'Pixel', fontSize: '.8vw', border: 0 };
  const headerStyle = { ...cellStyle, fontSize: '1vw' };

  let logs = props.kami.kills!.concat(props.kami.deaths!);
  logs = logs.sort((a, b) => b.time - a.time);

  const getMonetaryOutcomeString = (log: Kill): string => {
    if (log.target?.index) {
      return `+${log.bounty}`;
    } else {
      return `-${log.balance}`;
    }
  }

  const Row = (log: Kill, index: number) => {
    const killStyle = { ...cellStyle, color: 'green' };
    const deathStyle = { ...cellStyle, color: 'red' };
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
        <TableCell sx={cellStyle}>{log.node.name}</TableCell>
        <TableCell
          sx={{ ...cellStyle, cursor: 'pointer' }}
          onClick={() => setKami(subject?.entityIndex!)}
        >
          {subject?.name}
        </TableCell>
        <TableCell sx={(type === 'kill') ? killStyle : deathStyle}>{type}</TableCell>
        <TableCell sx={(type === 'kill') ? killStyle : deathStyle}>
          {getMonetaryOutcomeString(log)}
        </TableCell>
      </TableRow>
    );
  };

  return (
    <Container style={{ overflowY: 'scroll' }}>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow key='header'>
              <TableCell sx={headerStyle}>Time</TableCell>
              <TableCell sx={headerStyle}>Place</TableCell>
              <TableCell sx={headerStyle}>Adversary</TableCell>
              <TableCell sx={headerStyle}>Outcome</TableCell>
              <TableCell sx={headerStyle}>PnL ($MUSU)</TableCell>
            </TableRow>
          </TableHead>
          {logs.map((log, index) => Row(log, index))}
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