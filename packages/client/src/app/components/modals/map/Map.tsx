import { EntityID, EntityIndex } from '@mud-classic/recs';
import { useEffect, useState, useMemo } from 'react';

import { Account, getAccount as _getAccount } from 'app/cache/account';
import { getKami as _getKami } from 'app/cache/kami';
import { getNodeByIndex } from 'app/cache/node';
import { getRoom as _getRoom, getRoomByIndex as _getRoomByIndex } from 'app/cache/room';
import { ModalHeader, ModalWrapper } from 'app/components/library';
import { UIComponent } from 'app/root/types';
import { useLayers } from 'app/root/hooks';
import { useSelected, useVisibility } from 'app/stores';
import { MapIcon } from 'assets/images/icons/menu';
import {
  queryAccountFromEmbedded,
  queryAccountKamis,
  queryRoomAccounts as _queryRoomAccounts,
} from 'network/shapes/Account';
import { Allo, parseAllos as _parseAllos } from 'network/shapes/Allo';
import { Condition, passesConditions as _passesConditions } from 'network/shapes/Conditional';
import { getKamiLocation as _getKamiLocation } from 'network/shapes/Kami';
import { queryNodeByIndex as _queryNodeByIndex, queryNodeKamis as _queryNodeKamis } from 'network/shapes/Node';
import { queryRooms, Room } from 'network/shapes/Room';
import { queryScavInstance as _queryScavInstance } from 'network/shapes/Scavenge';
import { getValue as _getValue } from 'network/shapes/utils/component';
import { Grid } from './Grid';

export const MapModal: UIComponent = {
  id: 'MapModal',
  Render: () => {
    const layers = useLayers();

    const {
      network,
      data: {
        account,
        accountKamis
      },
      utils: {
        getAccount,
        getRoom,
        getRoomByIndex,
        getKami,
        getKamiLocation,
        passesConditions,
        queryNodeByIndex,
        queryNodeKamis,
        queryAllRooms,
        queryRoomAccounts,
        getNode,
        parseAllos,
        queryScavInstance,
        getValue
      }
    } = useMemo(() => {
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
          passesConditions: (account: Account, gates: Condition[]) =>
            _passesConditions(world, components, gates, account),
          queryNodeByIndex: (index: number) => _queryNodeByIndex(world, index),
          queryNodeKamis: (nodeEntity: EntityIndex) => _queryNodeKamis(world, components, nodeEntity),
          queryAllRooms: () => queryRooms(components),
          queryRoomAccounts: (roomIndex: number) => _queryRoomAccounts(components, roomIndex),
          getNode: (index: number) => getNodeByIndex(world, components, index),
          parseAllos: (allos: Allo[]) => _parseAllos(world, components, allos, true),
          queryScavInstance: (index: number, holderID: EntityID) =>
            _queryScavInstance(world, 'NODE', index, holderID),
          getValue: (entity: EntityIndex) => _getValue(components, entity),
        },
      };
    }, [layers]);

      const { actions, api } = network;
      const { roomIndex } = useSelected();
      const { modals } = useVisibility();

      const [roomMap, setRoomMap] = useState<Map<number, Room>>(new Map());
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
        if (!modals.map) return;
        const newRoom = getRoomByIndex(roomIndex);
        const newZone = newRoom.location.z;
        if (zone == newZone) return;

        const roomMap = new Map<number, Room>();
        const roomEntities = queryAllRooms();
        const rooms = roomEntities.map((entity) => getRoom(entity));
        const filteredRooms = rooms.filter((room) => room.location.z == newZone);
        filteredRooms.forEach((r) => roomMap.set(r.index, r));

        setZone(newZone);
        setRoomMap(roomMap);
      }, [modals.map, roomIndex]);

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

      return (
        <ModalWrapper
          id='map'
          header={<ModalHeader title={roomMap.get(roomIndex)?.name ?? 'Map'} icon={MapIcon} />}
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
            }}
            state={{ tick }}
            utils={{
              getKami,
              getKamiLocation,
              passesConditions,
              queryNodeByIndex,
              queryNodeKamis,
              queryRoomAccounts,
              getNode,
              parseAllos,
              queryScavInstance,
              getValue
            }}
          />
        </ModalWrapper>
      );
  },
};
