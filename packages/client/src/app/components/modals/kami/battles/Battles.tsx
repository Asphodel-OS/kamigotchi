import { EntityID, EntityIndex } from '@mud-classic/recs';
import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { getBattles } from 'app/cache/battles';
import { Text } from 'app/components/library';
import { getKamidenClient, Kill } from 'clients/kamiden';
import { Account } from 'network/shapes';
import { Kami } from 'network/shapes/Kami';
import { Node } from 'network/shapes/Node';
import { TabType } from '../Kami';
import { AdversaryColumn } from './AdversaryColumn';
import { DateColumn } from './DateColumn';
import { EventColumn } from './EventColumn';
import { LocationColumn } from './LocationColumn';
import { OwnerColumn } from './OwnerColumn';

const KamidenClient = getKamidenClient();

interface BattleStats {
  Kills: number;
  Deaths: number;
  PNL: number;
}

export const Battles = ({
  kami,
  utils,
}: {
  kami: Kami;
  setKami: Dispatch<SetStateAction<Kami | undefined>>;
  tab: TabType;
  utils: {
    getAccountByID: (id: EntityID) => Account;
    getKami: (entity: EntityIndex) => Kami;
    getKamiByID: (id: EntityID) => Kami;
    getEntityIndex: (entity: EntityID) => EntityIndex;
    getOwner: (entity: EntityIndex) => Account;
    getNodeByIndex: (index: number) => Node;
  };
}) => {
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

  /////////////////
  // INTERPRETATION

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

  /////////////////
  // DISPLAY

  return (
    <Container ref={feedRef} style={{ overflowY: 'auto' }}>
      <Stats>
        <Text size={0.8}>Kills: {(battleStats?.Kills ?? 0).toLocaleString()}</Text>
        <Text size={0.8}>Deaths: {battleStats?.Deaths ?? 0}</Text>
        <Text size={0.8} color={battleStats?.PNL && battleStats?.PNL > 0 ? 'green' : 'red'}>
          PNL: {(battleStats?.PNL ?? 0).toLocaleString()}
        </Text>
      </Stats>
      <Table>
        <EventColumn kami={kami} kills={kamidenKills} />
        <DateColumn kills={kamidenKills} />
        <AdversaryColumn kills={kamidenKills} utils={utils} />
        <OwnerColumn kills={kamidenKills} utils={utils} />
        <LocationColumn kills={kamidenKills} utils={utils} />
      </Table>
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  width: 100%;

  display: flex;
  flex-flow: column nowrap;
  user-select: none;
`;

const Table = styled.div`
  position: relative;
  border: solid black 0.15vw;
  border-radius: 0.6vw;

  margin: 0 0.9vw;
  padding: 0.6vw;
  gap: 0.9vw;

  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: space-between;
`;

const Stats = styled.div`
  width: fit-content;
  border: solid black 0.15vw;
  border-radius: 0.6vw;
  margin: 0.9vw;
  padding: 0.3vw;
  gap: 0.6vw;

  display: flex;
  flex-flow: row nowrap;
`;
