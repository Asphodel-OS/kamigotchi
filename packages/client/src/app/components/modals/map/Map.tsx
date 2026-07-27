import { EntityID, EntityIndex } from 'engine/recs';
import { useEffect, useState } from 'react';

import styled from 'styled-components';

import { getAccount as _getAccount } from 'app/cache/account';
import { getKami as _getKami } from 'app/cache/kami';
import { getNodeByIndex } from 'app/cache/node';
import { getRoom as _getRoom, getRoomByIndex as _getRoomByIndex } from 'app/cache/room';
import { IconButton, ModalWrapper, Popover, TextTooltip } from 'app/components/library';
import { useLayers } from 'app/root/hooks';
import { UIComponent } from 'app/root/types';
import { useSelected, useVisibility } from 'app/stores';
import { MapIcon } from 'assets/images/icons/menu';
import ResetIcon from 'assets/images/icons/menu/reset.png';
import { SEXTANT_INDEX } from 'constants/items';
import { playClick } from 'utils/sounds';
import {
  queryRoomAccounts as _queryRoomAccounts,
  queryAccountFromEmbedded,
  queryAccountKamis,
} from 'network/shapes/Account';
import { Allo, parseAllos as _parseAllos } from 'network/shapes/Allo';
import { getItemBalance } from 'network/shapes/Item';
import { getKamiLocation as _getKamiLocation } from 'network/shapes/Kami';
import {
  queryNodeByIndex as _queryNodeByIndex,
  queryNodeKamis as _queryNodeKamis,
} from 'network/shapes/Node';
import { Room, canEnterRoom as _canEnterRoom, queryRooms } from 'network/shapes/Room';
import { queryScavInstance as _queryScavInstance } from 'network/shapes/Scavenge';
import { getValue as _getValue } from 'network/shapes/utils/component';
import { Grid } from './Grid';

export const MapModal: UIComponent = {
  id: 'MapModal',
  Render: () => {
    const layers = useLayers();

    const {
      network,
      data: { account, accountKamis },
      utils: {
        getAccount,
        getRoom,
        getRoomByIndex,
        getKami,
        getKamiLocation,
        canEnterRoom,
        queryNodeByIndex,
        queryNodeKamis,
        queryAllRooms,
        queryRoomAccounts,
        getNode,
        parseAllos,
        queryScavInstance,
        getValue,
        getSextantBalance,
      },
    } = (() => {
      const { network } = layers;
      const { world, components } = network;
      const accountEntity = queryAccountFromEmbedded(network);
      const accountOptions = { live: 2 };
      const roomOptions = { exits: 3600 };

      return {
        network,
        data: {
          account: _getAccount(world, components, accountEntity, accountOptions),
          accountKamis: queryAccountKamis(world, components, accountEntity),
        },
        utils: {
          getAccount: () => _getAccount(world, components, accountEntity, accountOptions),
          getRoom: (entity: EntityIndex) => _getRoom(world, components, entity, roomOptions),
          getRoomByIndex: (index: number) => _getRoomByIndex(world, components, index),
          getKami: (entity: EntityIndex) =>
            _getKami(world, components, entity, { live: 2, harvest: 10 }),
          getKamiLocation: (entity: EntityIndex) => _getKamiLocation(world, components, entity),
          canEnterRoom: (room: Room) => _canEnterRoom(world, components, account, room),
          queryNodeByIndex: (index: number) => _queryNodeByIndex(world, index),
          queryNodeKamis: (nodeEntity: EntityIndex) =>
            _queryNodeKamis(world, components, nodeEntity),
          queryAllRooms: () => queryRooms(components),
          queryRoomAccounts: (roomIndex: number) => _queryRoomAccounts(components, roomIndex),
          getNode: (index: number) => getNodeByIndex(world, components, index),
          parseAllos: (allos: Allo[]) => _parseAllos(world, components, allos, true),
          queryScavInstance: (index: number, holderID: EntityID) =>
            _queryScavInstance(world, 'NODE', index, holderID),
          getValue: (entity: EntityIndex) => _getValue(components, entity),
          getSextantBalance: () =>
            getItemBalance(world, components, world.entities[accountEntity], SEXTANT_INDEX),
        },
      };
    })();

    const { actions, api } = network;
    const roomIndex = useSelected((s) => s.roomIndex);
    const mapModalOpen = useVisibility((s) => s.modals.map);

    const [roomMap, setRoomMap] = useState<Map<number, Room>>(new Map());
    const [zone, setZone] = useState(0);
    const [tick, setTick] = useState(Date.now());
    const [selectedZone, setSelectedZone] = useState<number | null>(null); // null = follow player

    // ticking
    useEffect(() => {
      const timer = () => setTick(Date.now());
      const timerID = setInterval(timer, 10000);
      return () => clearInterval(timerID);
    }, []);

    // opening the modal always shows the map the player is currently in;
    // reset during render so the old zone never flashes on reopen
    const [wasOpen, setWasOpen] = useState(mapModalOpen);
    if (wasOpen !== mapModalOpen) {
      setWasOpen(mapModalOpen);
      if (mapModalOpen) setSelectedZone(null);
    }

    const currentPlayerZone = getRoomByIndex(roomIndex).location.z;
    const displayZone = selectedZone !== null ? selectedZone : currentPlayerZone;
    const isViewingDifferentZone = displayZone !== currentPlayerZone;

    // query the set of rooms whenever the displayed zone changes
    // NOTE: roomIndex is controlled by canvas/Scene.tsx
    useEffect(() => {
      if (!mapModalOpen) return;
      if (zone == displayZone) return;

      const roomMap = new Map<number, Room>();
      const roomEntities = queryAllRooms();
      // Load rooms WITH exits for pathfinding to work
      const rooms = roomEntities.map((entity) => getRoom(entity));
      const filteredRooms = rooms.filter((room) => room.location.z == displayZone);
      filteredRooms.forEach((r) => roomMap.set(r.index, r));

      setZone(displayZone);
      setRoomMap(roomMap);
    }, [mapModalOpen, roomIndex, displayZone]);

    ///////////////////
    // ACTIONS

    const move = (index: number) => {
      actions.add({
        action: 'AccountMove',
        params: [index],
        description: `Moving to ${roomMap.get(index)?.name}`,
        execute: async () => {
          return api.player.account.move(index);
        },
      });
    };

    ///////////////////
    // RENDER

    // zone 4's name is concealed on purpose: lore stays hidden even with access
    const ZONE_NAMES: { [zone: number]: string } = {
      1: 'Lost Woods',
      3: 'Sanctuary Caves',
      4: '??????',
    };

    // when exploring another map the header carries its name instead of the room's
    const headerTitle = isViewingDifferentZone
      ? (ZONE_NAMES[displayZone] ?? 'Map')
      : (roomMap.get(roomIndex)?.name ?? 'Map');

    // zone 4 stays out of the dropdown until the player carries the Aetheric Sextant
    const zoneVisible = (zone: number) =>
      zone !== 4 || currentPlayerZone === 4 || getSextantBalance() > 0;

    // selecting the zone the player stands in returns to follow mode
    const zoneOptions = Object.entries(ZONE_NAMES)
      .filter(([z]) => zoneVisible(Number(z)))
      .map(([z, name]) => {
        const zoneNum = Number(z);
        return {
          text: name,
          disabled: zoneNum === displayZone,
          onClick: () => setSelectedZone(zoneNum === currentPlayerZone ? null : zoneNum),
        };
      });

    return (
      <ModalWrapper
        id='map'
        header={
          <MapHeader>
            <HeaderIcon src={MapIcon} alt={headerTitle} />
            <HeaderTitle>{headerTitle}</HeaderTitle>
            <Popover
              content={zoneOptions.map((option, i) => (
                <ZoneOption
                  key={i}
                  disabled={option.disabled}
                  onClick={() => {
                    if (option.disabled) return;
                    playClick();
                    option.onClick();
                  }}
                >
                  {option.text}
                </ZoneOption>
              ))}
              closeOnClick
            >
              <TextTooltip text={['Switch Map']}>
                {/* empty handler keeps the click sound; Popover owns the toggle */}
                <IconButton img={ResetIcon} onClick={() => {}} noBorder scale={2.5} />
              </TextTooltip>
            </Popover>
          </MapHeader>
        }
        canExit
        noPadding
        truncate
        scrollBarColor='#cbba3d #e1e1b5'
      >
        <Grid
          actions={{ move }}
          data={{
            account,
            accountKamis,
            roomIndex,
            zone,
            rooms: roomMap,
            isViewingDifferentZone,
          }}
          state={{ tick }}
          utils={{
            getKami,
            getKamiLocation,
            canEnterRoom,
            queryNodeByIndex,
            queryNodeKamis,
            queryRoomAccounts,
            getNode,
            parseAllos,
            queryScavInstance,
            getValue,
          }}
          network={{
            world: network.world,
            components: network.components,
          }}
        />
      </ModalWrapper>
    );
  },
};

const MapHeader = styled.div`
  padding: 0.6vw 1vw;
  gap: 0.7vw;
  line-height: 1.5vw;

  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: flex-start;
  user-select: none;
`;

const HeaderIcon = styled.img`
  height: 2vw;
  width: auto;
  user-drag: none;
`;

const HeaderTitle = styled.div`
  font-size: 1.2vw;
  color: #333;
  text-align: left;
  font-family: Pixel;
  margin-right: 0.3vw;
  line-height: 1.2vw;
  display: flex;
  align-items: center;
`;

const ZoneOption = styled.div<{ disabled?: boolean }>`
  padding: 0.6vw 1.2vw;
  font-size: 0.9vw;
  font-family: Pixel;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  background-color: ${({ disabled }) => (disabled ? '#bbb' : '#fff')};
  user-select: none;

  &:hover {
    background-color: ${({ disabled }) => (disabled ? '#bbb' : '#e8e8e8')};
  }
`;
