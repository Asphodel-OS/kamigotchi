import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { getAccount as _getAccount } from 'app/cache/account';
import { getKami as _getKami } from 'app/cache/kami';
import { useLayers } from 'app/root/hooks';
import { UIComponent } from 'app/root/types';
import { useSelected } from 'app/stores';
import { backgrounds } from 'assets/images/backgrounds';
import { EntityIndex } from 'engine/recs';
import { queryAccountFromEmbedded, queryAccountKamis } from 'network/shapes/Account';
import { getGoalByIndex as _getGoalByIndex } from 'network/shapes/Goals';
import { queryNodeByIndex, queryNodeKamis } from 'network/shapes/Node';
import { getRoomIndex as _getRoomIndex } from 'network/shapes/utils/component';
import { Room } from './Room';

// live kami data staleness limit in seconds
const LIVE_UPDATE_LIMIT = 2;

// The Scene paints the wallpaper and the room. It updates the selected room
// index in the Selected store whenever the player switches rooms or changes
// the connected account.
export const Scene: UIComponent = {
  id: 'Scene',
  Render: () => {
    const layers = useLayers();

    /////////////////
    // PREPARATION

    const { data, utils } = (() => {
      const { network } = layers;
      const { world, components } = network;
      const { nodeIndex } = useSelected.getState();
      const accountEntity = queryAccountFromEmbedded(network);
      const nodeEntity = queryNodeByIndex(world, nodeIndex);

      const kamiRefreshOptions = {
        live: LIVE_UPDATE_LIMIT,
        bonuses: 3600,
        config: 3600,
        harvest: LIVE_UPDATE_LIMIT,
        progress: 3600,
        skills: 3600,
        stats: 3600,
        traits: 3600,
      };
      return {
        data: {
          accountEntity,
          kamiEntities: {
            account: queryAccountKamis(world, components, accountEntity),
            node: queryNodeKamis(world, components, nodeEntity),
          },
        },
        utils: {
          getAccount: (entity: EntityIndex) => _getAccount(world, components, entity),
          getGoalByIndex: (index: number) => _getGoalByIndex(world, components, index),
          getRoomIndex: (entity: EntityIndex) => _getRoomIndex(components, entity),
          getKami: (entity: EntityIndex) => _getKami(world, components, entity, kamiRefreshOptions),
        },
      };
    })();

    /////////////////
    // INSTANTIATION

    const { accountEntity, kamiEntities } = data;
    const { getRoomIndex, getKami } = utils;

    const roomIndex = useSelected((s) => s.roomIndex);
    const setRoom = useSelected((s) => s.setRoom);
    const [lastRefresh, setLastRefresh] = useState(Date.now());
    const [kamis, setKamis] = useState<EntityIndex[]>([]);

    /////////////////
    // SUBSCRIPTION

    // ticking
    useEffect(() => {
      const timerId = setInterval(() => {
        setLastRefresh(Date.now());
      }, 250);
      return () => clearInterval(timerId);
    }, []);

    // update the room index on each interval and whenever the account changes
    useEffect(() => {
      if (!accountEntity) return;
      const roomIndex = getRoomIndex(accountEntity);
      setRoom(roomIndex);
    }, [accountEntity, lastRefresh]);

    // identify ally vs enemy kamis whenever the list of kamis changes
    useEffect(() => {
      const allies: EntityIndex[] = [];
      const enemies: EntityIndex[] = [];
      kamiEntities.node.forEach((entity) => {
        if (kamiEntities.account.includes(entity)) allies.push(entity);
        else enemies.push(entity);
      });
      setKamis(allies.concat(enemies));
    }, [lastRefresh]);

    /////////////////
    // DISPLAY

    return (
      <Wrapper>
        <Container>
          <Room index={roomIndex} data={{ kamis }} utils={{ getKami }} />
          <Wallpaper src={backgrounds.long2} />
        </Container>
      </Wrapper>
    );
  },
};

const Wrapper = styled.div`
  display: block;
  justify-content: center;
  align-items: center;
  opacity: 1;
  z-index: -5;
  pointer-events: auto;
  position: absolute;
  width: 100%;
  height: 100%;
  user-select: none;
`;

const Container = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  z-index: -4;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Wallpaper = styled.img`
  position: absolute;
  width: 100%;
  max-height: 100%;
  object-fit: cover;

  z-index: -3;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
`;
