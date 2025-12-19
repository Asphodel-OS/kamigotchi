import { EntityID, EntityIndex } from 'engine/recs';
import { useEffect, useState } from 'react';

import { getAccount as _getAccount } from 'app/cache/account';
import { getKami as _getKami } from 'app/cache/kami';
import { getNodeByIndex } from 'app/cache/node';
import { getRoom as _getRoom, getRoomByIndex as _getRoomByIndex } from 'app/cache/room';
import { IconListButton, ModalHeader, ModalWrapper, Overlay } from 'app/components/library';
import { useLayers } from 'app/root/hooks';
import { UIComponent } from 'app/root/types';
import { useSelected, useVisibility } from 'app/stores';
import { HelpMenuIcons } from 'assets/images/help';
import { ActionIcons } from 'assets/images/icons/actions';
import { insectIcon } from 'assets/images/icons/affinities';
import { KamiIcon, MapIcon, OperatorIcon } from 'assets/images/icons/menu';
import {
  queryRoomAccounts as _queryRoomAccounts,
  queryAccountFromEmbedded,
  queryAccountKamis,
} from 'network/shapes/Account';
import { Allo, parseAllos as _parseAllos } from 'network/shapes/Allo';
import { getKamiLocation as _getKamiLocation } from 'network/shapes/Kami';
import {
  queryNodeByIndex as _queryNodeByIndex,
  queryNodeKamis as _queryNodeKamis,
} from 'network/shapes/Node';
import { Room, canEnterRoom as _canEnterRoom, queryRooms } from 'network/shapes/Room';
import { queryScavInstance as _queryScavInstance } from 'network/shapes/Scavenge';
import { getValue as _getValue } from 'network/shapes/utils/component';
import { Grid } from './Grid';
import { Mode } from './types';

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
        },
      };
    })();

    const { actions, api } = network;
    const roomIndex = useSelected((s) => s.roomIndex);
    const mapModalOpen = useVisibility((s) => s.modals.map);

    const [roomMap, setRoomMap] = useState<Map<number, Room>>(new Map());
    const [mode, setMode] = useState<Mode>('MyKamis');
    const [zone, setZone] = useState(0);
    const [tick, setTick] = useState(Date.now());

    // ticking
    useEffect(() => {
      const timer = () => setTick(Date.now());
      const timerID = setInterval(timer, 10000);
      return () => clearInterval(timerID);
    }, []);

    // query the set of rooms whenever the zone changes
    // NOTE: roomIndex is controlled by canvas/Scene.tsx
    useEffect(() => {
      if (!mapModalOpen) return;
      const newRoom = getRoomByIndex(roomIndex);
      const newZone = newRoom.location.z;
      if (zone == newZone) return;

      const roomMap = new Map<number, Room>();
      const roomEntities = queryAllRooms();
      // Load rooms WITH exits for pathfinding to work
      const rooms = roomEntities.map((entity) => getRoom(entity));
      const filteredRooms = rooms.filter((room) => room.location.z == newZone);
      filteredRooms.forEach((r) => roomMap.set(r.index, r));

      setZone(newZone);
      setRoomMap(roomMap);
    }, [mapModalOpen, roomIndex]);

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

    /////////////////
    // INTERPRETATION

    const ModeOptions = [
      { text: 'My Kamis', image: KamiIcon, onClick: () => setMode('MyKamis') },
      { text: 'Room Type', image: insectIcon, onClick: () => setMode('RoomType') },
      { text: 'Kami Count', image: HelpMenuIcons.kamis, onClick: () => setMode('KamiCount') },
      { text: 'Operator Count', image: OperatorIcon, onClick: () => setMode('OperatorCount') },
    ];

    /////////////////
    // RENDER

    return (
      <ModalWrapper
        id='map'
        header={<ModalHeader title={roomMap.get(roomIndex)?.name ?? 'Map'} icon={MapIcon} />}
        canExit
        truncate
        noPadding
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
          }}
          state={{ mode, tick }}
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
        <Overlay top={0.3} left={0.3}>
          <IconListButton
            img={ActionIcons.search}
            text={mode}
            tooltip={{ text: ['Filter tile by Type'] }}
            options={ModeOptions}
            radius={0.6}
          />
        </Overlay>
      </ModalWrapper>
    );
  },
};
