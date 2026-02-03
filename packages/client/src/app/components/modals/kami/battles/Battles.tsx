import { EntityID, EntityIndex } from 'engine/recs';
import { Dispatch, Fragment, SetStateAction, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { getBattles } from 'app/cache/battles';
import { Text, TextTooltip } from 'app/components/library';
import { useSelected, useVisibility } from 'app/stores';
import { DeathIcon, KillIcon } from 'assets/images/icons/battles';
import { getKamidenClient, Kill } from 'clients/kamiden';
import { Account } from 'network/shapes';
import { Kami } from 'network/shapes/Kami';
import { Node } from 'network/shapes/Node';
import { getAffinityImage } from 'network/shapes/utils';
import { playClick } from 'utils/sounds';
import { abbreviateString } from 'utils/strings';
import { getDateString, getKamiDate, getKamiTime, getPhaseIcon, getPhaseOf } from 'utils/time';
import { TabType } from '../Kami';

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
  const [battleStats, setBattleStats] = useState<BattleStats | null>(null);

  const { getKamiByID, getOwner, getNodeByIndex } = utils;
  const setKamiSelected = useSelected((s) => s.setKami);
  const accountIndex = useSelected((s) => s.accountIndex);
  const setAccount = useSelected((s) => s.setAccount);
  const setNode = useSelected((s) => s.setNode);
  const { modals, setModals } = useVisibility();

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
  // HELPERS

  const getPnLString = (kill: Kill) => {
    if (kill.IsDeath) {
      const bounty = parseInt(kill.Bounty);
      const salvage = parseInt(kill.Salvage);
      return `-${bounty - salvage}`;
    }
    return '+' + kill.Spoils;
  };

  const getEventTooltipText = (kill: Kill) => {
    const eventType = kami.id === kill.KillerId ? 'Killed' : 'Died';
    const healthSync = kill.VictimHealthSync;
    const healthTotal = kill.VictimHealthTotal;
    const healthPercent = ((healthSync / healthTotal) * 100).toFixed(1);
    const bounty = parseInt(kill.Bounty);
    const salvage = parseInt(kill.Salvage);
    const spoils = parseInt(kill.Spoils);

    const tooltip = [`${eventType} with ${healthSync}/${healthTotal}HP (${healthPercent}%)`];
    if (kill.IsDeath) tooltip.push(`${salvage}/${bounty} musu salvaged`);
    else tooltip.push(`${spoils}/${bounty} musu plundered`);
    return tooltip;
  };

  const getDateTooltipText = (kill: Kill) => {
    const date = getDateString(kill.Timestamp, 0);
    const kamiTime = getKamiTime(kill.Timestamp, 0);
    const kamiDate = getKamiDate(kill.Timestamp, 0);
    return [`${kamiDate} ${kamiTime}`, '...', `or ${date}`, 'on your plebeian calendar'];
  };

  /////////////////
  // CLICK HANDLERS

  const selectKami = (index: number) => {
    setKamiSelected(index);
    playClick();
  };

  const selectAccount = (index: number) => {
    const isMobile = window.matchMedia('(max-aspect-ratio: 11/16)').matches;
    if (!modals.account) {
      setModals({
        account: true,
        map: false,
        party: false,
        ...(isMobile && { kami: false }),
      });
    } else if (accountIndex === index) {
      setModals({ account: false });
    }
    setAccount(index);
    playClick();
  };

  const showNode = (node: Node) => {
    const isMobile = window.matchMedia('(max-aspect-ratio: 11/16)').matches;
    setNode(node.index);
    setModals({
      node: true,
      crafting: false,
      kami: false,
      ...(isMobile && { party: false }),
    });
    playClick();
  };

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
        <Header>Event</Header>
        <Header>Date</Header>
        <Header>Adversary</Header>
        <Header>Owner</Header>
        <Header>Location</Header>

        {kamidenKills.map((kill, index) => {
          const adversaryId = kill.IsDeath ? kill.KillerId : kill.VictimId;
          const adversary = getKamiByID(adversaryId as EntityID);
          const account = getOwner(adversary.entity);
          const node = getNodeByIndex(kill.RoomIndex as EntityIndex);
          const kamiDate = getKamiDate(kill.Timestamp, 0);
          const isOdd = index % 2 === 1;

          return (
            <Fragment key={index}>
              {/* Event  */}
              <TextTooltip key={`event-${index}`} text={getEventTooltipText(kill)}>
                <Row $isOdd={isOdd}>
                  <Icon src={kill.IsDeath ? DeathIcon : KillIcon} />
                  <Text size={0.9} color={kill.IsDeath ? 'red' : 'green'}>
                    {getPnLString(kill)}
                  </Text>
                </Row>
              </TextTooltip>

              {/* Date  */}
              <TextTooltip key={`date-${index}`} text={getDateTooltipText(kill)}>
                <Row $isOdd={isOdd}>
                  <Icon src={getPhaseIcon(getPhaseOf(kill.Timestamp, 0))} />
                  <Text size={0.9}>{kamiDate}</Text>
                </Row>
              </TextTooltip>

              {/* Adversary  */}
              <Row
                key={`adversary-${index}`}
                $isOdd={isOdd}
                $clickable
                onClick={() => selectKami(adversary.index)}
              >
                <Text size={0.9}>{adversary.name}</Text>
              </Row>

              {/* Owner  */}
              <Row
                key={`owner-${index}`}
                $isOdd={isOdd}
                $clickable
                onClick={() => selectAccount(account.index)}
              >
                <Text size={0.9}>{account.name}</Text>
              </Row>

              {/* Location  */}
              <TextTooltip key={`location-${index}`} text={[node.name]}>
                <Row $isOdd={isOdd} $clickable onClick={() => showNode(node)}>
                  {node.affinity.map((aff, i) => (
                    <Icon key={i} src={getAffinityImage(aff)} />
                  ))}
                  <Text size={0.9}>{abbreviateString(node.name)}</Text>
                </Row>
              </TextTooltip>
            </Fragment>
          );
        })}
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
  overflow-y: auto;
  height: 100%;
`;

const Table = styled.div`
  position: relative;
  border: solid black 0.15em;
  border-radius: 0.6em;

  margin: 0 0.9em;
  padding: 0.6em;
  gap: 0.3em;

  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
`;

const Header = styled.div`
  font-size: 1.2em;
  font-weight: bold;
  white-space: normal;
  word-break: break-word;
  padding: 0.3em;
  border-bottom: solid black 0.1em;
  width: 100%;
`;

const Row = styled.div<{ $isOdd?: boolean; $clickable?: boolean }>`
  display: flex;
  flex-flow: row wrap;
  align-items: center;
  justify-content: flex-start;
  height: 100%;
  background-color: ${({ $isOdd }) => ($isOdd ? '#e4e4e4ff' : 'white')};
  white-space: normal;
  word-break: break-word;
  ${({ $clickable }) =>
    $clickable &&
    `
    cursor: pointer;
    &:hover {
      opacity: 0.8;
    }
  `}
`;

const Stats = styled.div`
  width: fit-content;
  border: solid black 0.15em;
  border-radius: 0.6em;
  margin: 0.9em;
  padding: 0.3em;
  gap: 0.6em;

  display: flex;
  flex-flow: row nowrap;
`;

const Icon = styled.img`
  height: 1.2em;
  width: 1.2em;
`;
