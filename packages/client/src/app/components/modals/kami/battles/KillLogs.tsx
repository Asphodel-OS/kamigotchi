import { Table, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import styled from 'styled-components';

import { Tooltip } from 'app/components/library';
import { useSelected, useVisibility } from 'app/stores';
import { DeathIcon, KillIcon } from 'assets/images/icons/battles';
import { Kami } from 'network/shapes/Kami';
import { Kill } from 'network/shapes/Kill';
import { playClick } from 'utils/sounds';

interface Props {
  kami: Kami;
}

// Rendering of the Kami's Kill/Death Logs
export const KillLogs = (props: Props) => {
  const { setKami, setNode } = useSelected();
  const { modals, setModals } = useVisibility();
  const cellStyle = { fontFamily: 'Pixel', fontSize: '.8vw', border: 0 };
  const headerStyle = { ...cellStyle, fontSize: '1vw' };

  let logs = props.kami.kills!.concat(props.kami.deaths!);
  logs = logs.sort((a, b) => b.time - a.time);

  const getPnLString = (log: Kill): string => {
    if (log.target?.index) {
      return `+${log.bounty}`;
    } else {
      return `-${log.balance}`;
    }
  };

  const Head = () => (
    <TableHead>
      <TableRow key='header'>
        <TableCell sx={headerStyle}>Event</TableCell>
        <TableCell sx={headerStyle}>Time</TableCell>
        <TableCell sx={headerStyle}>Adversary</TableCell>
        <TableCell sx={headerStyle}>Location</TableCell>
      </TableRow>
    </TableHead>
  );

  const Entry = (log: Kill, index: number) => {
    const type = log.source?.index === undefined ? 'kill' : 'death';
    const adversary = log.source?.index === undefined ? log.target : log.source;
    const date = new Date(log.time * 1000);
    const dateString = date.toLocaleString('default', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });

    return (
      <TableRow key={index}>
        <TableCell sx={cellStyle}>
          <Cell>
            <Tooltip text={[type]}>
              <Icon src={type === 'kill' ? KillIcon : DeathIcon} />
            </Tooltip>
            <Text color={type === 'kill' ? 'green' : 'red'}>{getPnLString(log)}</Text>
          </Cell>
        </TableCell>
        <TableCell sx={cellStyle}>{dateString}</TableCell>

        <TableCell
          sx={{ ...cellStyle, cursor: 'pointer', '&:hover': { color: 'grey' } }}
          onClick={() => {
            setKami(adversary?.index!);
            playClick();
          }}
        >
          {adversary?.name}
        </TableCell>
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
      </TableRow>
    );
  };

  return (
    <Container style={{ overflowY: 'scroll' }}>
      <TableContainer>
        <Table>
          <Head />
          <tbody>{logs.map((log, index) => Entry(log, index))}</tbody>
        </Table>
      </TableContainer>
    </Container>
  );
};

const Container = styled.div`
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
