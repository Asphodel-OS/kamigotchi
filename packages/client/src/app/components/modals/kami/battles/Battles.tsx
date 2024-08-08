import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import styled from 'styled-components';

import { Tooltip } from 'app/components/library';
import { Overlay } from 'app/components/library/styles';
import { useSelected, useVisibility } from 'app/stores';
import { DeathIcon, KillIcon } from 'assets/images/icons/battles';
import { Kami, KillLog } from 'network/shapes/Kami';
import { useEffect, useState } from 'react';
import { playClick } from 'utils/sounds';
import { getDateString, getKamiDate, getKamiTime, getPhaseIcon, getPhaseOf } from 'utils/time';

const cellStyle = { fontFamily: 'Pixel', fontSize: '.75vw', padding: '0.5vw', border: 0 };
const headerStyle = { ...cellStyle, fontSize: '.9vw' };

interface Props {
  kami: Kami;
  utils: {
    getBattles: (kami: Kami) => KillLog[];
  };
}

// Rendering of the Kami's Kill/Death Logs
export const Battles = (props: Props) => {
  const { kami, utils } = props;
  const { setKami, setNode } = useSelected();
  const { modals, setModals } = useVisibility();
  const [logs, setLogs] = useState<KillLog[]>([]);

  useEffect(() => {
    setLogs(utils.getBattles(kami));
  }, [modals.kami, kami.index]);

  /////////////////
  // INTERPRETATION

  const isKill = (log: KillLog): boolean => {
    return log.source.index === kami.index;
  };

  const isDeath = (log: KillLog): boolean => {
    return log.target.index === kami.index;
  };

  // assume death if not kill
  const getPnLString = (log: KillLog): string => {
    if (isKill(log)) return `+${log.bounty}`;
    return `-${log.balance}`;
  };

  /////////////////
  // DISPLAY

  const Head = () => (
    <TableHead>
      <TableRow key='header' sx={{ padding: '5vw' }}>
        <TableCell sx={headerStyle}>Event</TableCell>
        <TableCell sx={headerStyle}>Occurrence</TableCell>
        <TableCell sx={headerStyle}>Adversary</TableCell>
        <TableCell sx={headerStyle}>Location</TableCell>
      </TableRow>
    </TableHead>
  );

  // display the result of the battle
  const ResultCell = (log: KillLog) => {
    const type = isKill(log) ? 'kill' : 'death';
    return (
      <TableCell sx={cellStyle}>
        <Cell>
          <Tooltip text={[type]}>
            <Icon src={isKill(log) ? KillIcon : DeathIcon} />
          </Tooltip>
          <Text color={isKill(log) ? 'green' : 'red'}>{getPnLString(log)}</Text>
        </Cell>
      </TableCell>
    );
  };

  // display the time when it happened
  const TimeCell = (log: KillLog) => {
    const date = getDateString(log.time, 0);
    const kamiDate = getKamiDate(log.time, 0);
    const kamiTime = getKamiTime(log.time, 0);
    return (
      <TableCell sx={cellStyle}>
        <Tooltip text={[`${date}`, `on your plebeian calendar`]}>
          <Cell>
            {kamiDate}
            <Icon src={getPhaseIcon(getPhaseOf(log.time, 0))} />
            {kamiTime}
          </Cell>
        </Tooltip>
      </TableCell>
    );
  };

  // display the details of the adversary
  const AdversaryCell = (log: KillLog) => {
    const adversary = isKill(log) ? log.target : log.source;
    return (
      <TableCell
        sx={{ ...cellStyle, cursor: 'pointer', '&:hover': { color: 'grey' } }}
        onClick={() => {
          setKami(adversary.index);
          playClick();
        }}
      >
        {adversary?.name}
      </TableCell>
    );
  };

  // display the details of the node
  const NodeCell = (log: KillLog) => {
    return (
      <TableCell
        sx={{ ...cellStyle, cursor: 'pointer', '&:hover': { color: 'grey' } }}
        onClick={() => {
          setNode(log.node.index);
          setModals({ ...modals, kami: false, node: true });
          playClick();
        }}
      >
        {log.node.name}
      </TableCell>
    );
  };

  /////////////////
  // RENDERING

  return (
    <Container style={{ overflowY: 'scroll' }}>
      <Overlay top={0.7} right={0.75}>
        <Text>Kills: {logs.filter(isKill).length}</Text>
      </Overlay>
      <Overlay top={2} right={0.75}>
        <Text>Deaths: {logs.filter(isDeath).length}</Text>
      </Overlay>
      <TableContainer>
        <Table>
          <Head />
          <TableBody>
            {logs.map((log) => {
              return (
                <TableRow key={log.id}>
                  {ResultCell(log)}
                  {TimeCell(log)}
                  {AdversaryCell(log)}
                  {NodeCell(log)}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  border: solid black 0.15vw;
  border-radius: 0.5vw;
  margin: 0.7vw;
  padding: 0.7vw;

  display: flex;
  flex-flow: column nowrap;
`;

const Cell = styled.div`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: flex-start;
  gap: 0.6vw;
`;

const Text = styled.div<{ color?: string }>`
  font-family: Pixel;
  font-size: 0.8vw;
  color: ${({ color }) => color ?? 'black'};
`;

const Icon = styled.img`
  height: 1.5vw;
  width: 1.5vw;
`;
