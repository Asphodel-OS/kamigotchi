import { EntityID, EntityIndex } from '@mud-classic/recs';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { BigNumber } from 'ethers';
import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { getBattles } from 'app/cache/battles';
import { TextTooltip } from 'app/components/library';
import { Account, useSelected, useVisibility } from 'app/stores';
import { DeathIcon, KillIcon } from 'assets/images/icons/battles';
import { getKamidenClient, Kill } from 'clients/kamiden';
import { formatEntityID } from 'engine/utils';
import { Kami } from 'network/shapes/Kami';
import { Node } from 'network/shapes/Node';
import { getAffinityImage } from 'network/shapes/utils';
import { playClick } from 'utils/sounds';
import { getDateString, getKamiDate, getKamiTime, getPhaseIcon, getPhaseOf } from 'utils/time';
import { TabType } from '../Kami';

const cellStyle = {
  fontFamily: 'Pixel',
  fontSize: '.75vw',
  padding: '0.5vw',
  border: 0,
};
const headerStyle = { ...cellStyle, fontSize: '.9vw', fontWeight: `bold` };
const KamidenClient = getKamidenClient();

interface Props {
  kami: Kami;
  setKami: Dispatch<SetStateAction<Kami | undefined>>;
  tab: TabType;
  utils: {
    getKami: (entity: EntityIndex) => Kami;
    getEntityIndex: (entity: EntityID) => EntityIndex;
    getOwner: (entity: EntityIndex) => Account;
    getNodeByIndex: (index: number) => Node;
  };
}

interface BattleStats {
  Kills: number;
  Deaths: number;
  PNL: number;
}

export const Battles = (props: Props) => {
  const { kami, utils } = props;
  const { getKami, getEntityIndex, getOwner, getNodeByIndex } = utils;

  const { setKami, setAccount, kamiIndex } = useSelected();
  const { setModals } = useVisibility();

  const feedRef = useRef<HTMLDivElement>(null);
  const currentKamiIdRef = useRef(kami.id);
  const [kamidenKills, setKamidenKills] = useState<Kill[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const [noMoreKills, setNoMoreKills] = useState(false);
  const [scrollBottom, setScrollBottom] = useState(0);
  const [battleStats, setBattleStats] = useState<BattleStats | null>(null);

  // manages battlestats, initial scroll and polling
  useEffect(() => {
    currentKamiIdRef.current = kami.id;
    const kamiStr = BigInt(kami.id).toString();
    const fetchStats = async () => {
      const result = await KamidenClient?.getBattleStats({ KamiId: kamiStr });
      if (result?.BattleStats) setBattleStats(result.BattleStats);
    };
    fetchStats();
    setKamidenKills([]);
    setIsPolling(true);
    feedRef.current?.scrollTo(0, 0);
    pollBattles().finally(() => setIsPolling(false));
  }, [kami.id]);

  // handles scrolling and polling
  useEffect(() => {
    const node = feedRef.current;
    if (!node) return;
    node.addEventListener('scroll', handleScroll);
    return () => node.removeEventListener('scroll', handleScroll);
  }, [isPolling, kamidenKills, noMoreKills]);

  const handleScroll = async () => {
    const node = feedRef.current;
    if (!node || isPolling || noMoreKills) return;
    const { scrollTop, scrollHeight, clientHeight } = node;
    if (scrollTop + clientHeight >= scrollHeight - 10) {
      setIsPolling(true);
      await pollMoreBattles();
      setIsPolling(false);
    }
    setScrollBottom(scrollHeight - scrollTop - clientHeight);
  };

  const getPnLString = (kill: Kill) =>
    kill.IsDeath ? `-${parseInt(kill.Bounty) - parseInt(kill.Salvage)}` : `+${kill.Spoils}`;

  async function pollBattles() {
    const kills = await getBattles(kami.id, false);
    setNoMoreKills(kills.length === kamidenKills.length);
    setKamidenKills(kills);
  }

  // checks if currentKamiIdRef.current !== kami.id to avoid race conditions
  async function pollMoreBattles() {
    if (!KamidenClient || currentKamiIdRef.current !== kami.id) return;
    const kills = await getBattles(kami.id, true);
    if (currentKamiIdRef.current !== kami.id) return;
    kills.length === kamidenKills.length ? setNoMoreKills(true) : setKamidenKills(kills);
  }

  const Head = () => (
    <TableHead>
      <TableRow key='header' sx={{ padding: '5vw' }}>
        <TableCell sx={headerStyle}>Event</TableCell>
        <TableCell sx={headerStyle}>Occurrence</TableCell>
        <TableCell sx={headerStyle}>Adversary(Kami)</TableCell>
        <TableCell sx={headerStyle}>Adversary(Owner)</TableCell>
        <TableCell sx={headerStyle}>Location</TableCell>
      </TableRow>
    </TableHead>
  );

  const ResultCell = (kill: Kill) => (
    <TableCell sx={cellStyle}>
      <Cell>
        <TextTooltip text={[kami.id === kill.KillerId ? 'kill' : 'death']}>
          <Icon src={kill.IsDeath ? DeathIcon : KillIcon} />
        </TextTooltip>
        <Text color={kill.IsDeath ? 'red' : 'green'}>{getPnLString(kill)}</Text>
      </Cell>
    </TableCell>
  );

  const TimeCell = (kill: Kill) => {
    const date = getDateString(kill.Timestamp, 0);
    const kamiDate = getKamiDate(kill.Timestamp, 0);
    const kamiTime = getKamiTime(kill.Timestamp, 0);
    return (
      <TableCell sx={cellStyle}>
        <TextTooltip text={[date, 'on your plebeian calendar']}>
          <Cell>
            {kamiDate}
            <Icon src={getPhaseIcon(getPhaseOf(kill.Timestamp, 0))} />
            {kamiTime}
          </Cell>
        </TextTooltip>
      </TableCell>
    );
  };

  const AdversaryCell = (kill: Kill) => {
    const adversaryId = kill.IsDeath ? kill.KillerId : kill.VictimId;
    const adversaryKami = getKami(getEntityIndex(formatEntityID(BigNumber.from(adversaryId))));
    const owner = getOwner(adversaryKami.entity);
    return (
      <>
        <TableCell
          sx={{ ...cellStyle, cursor: 'pointer', '&:hover': { color: 'grey' } }}
          onClick={() => {
            setKami(adversaryKami.index);
            setModals({ kami: kamiIndex !== adversaryKami.index });
            playClick();
          }}
        >
          {adversaryKami.name}
        </TableCell>
        <TableCell
          sx={{ ...cellStyle, cursor: 'pointer', '&:hover': { color: 'grey' } }}
          onClick={() => {
            setAccount(owner.index);
            setModals({ party: false, account: true });
            playClick();
          }}
        >
          {owner.name}
        </TableCell>
      </>
    );
  };

  const NodeCell = (kill: Kill) => {
    const node = getNodeByIndex(kill.RoomIndex as EntityIndex);
    return (
      <TableCell sx={{ ...cellStyle }}>
        <Cell>
          <Icon src={getAffinityImage(node.affinity)} />
          {node.name}
        </Cell>
      </TableCell>
    );
  };

  return (
    <Container ref={feedRef} style={{ overflowY: 'auto' }}>
      <Border
        style={{
          display: 'flex',
          flexFlow: 'row nowrap',
        }}
      >
        <Text>Kills: {battleStats?.Kills ?? 0}</Text>
        <Text>Deaths: {battleStats?.Deaths ?? 0}</Text>
        <Text color={battleStats?.PNL && battleStats?.PNL > 0 ? 'green' : 'red'}>
          PNL: {battleStats?.PNL ?? 0}
        </Text>
      </Border>
      <Border>
        <TableContainer>
          <Table>
            <Head />
            <TableBody>
              {kamidenKills.map((kill, index) => (
                <TableRow key={`${kill.Timestamp}-${kill.KillerId}-${kill.VictimId}-${index}`}>
                  {ResultCell(kill)}
                  {TimeCell(kill)}
                  {AdversaryCell(kill)}
                  {NodeCell(kill)}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Border>
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  margin: 0.5vw;
  width: fit-content;
  display: flex;
  flex-flow: column nowrap;
  user-select: none;
`;

const Cell = styled.div`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: flex-start;
  gap: 0.3vw;
`;

const Text = styled.div<{ color?: string }>`
  font-family: Pixel;
  font-size: 0.8vw;
  color: ${({ color }) => color ?? 'black'};
  padding: 0.2vw;
`;

const Icon = styled.img`
  height: 1.5vw;
  width: 1.5vw;
`;

const Border = styled.div`
  width: fit-content;
  border: solid black 0.15vw;
  border-radius: 0.5vw;
  margin: 0.2vw 0;
  padding: 0.2vw;
`;
