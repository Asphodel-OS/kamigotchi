import { EntityID } from '@mud-classic/recs';
import { useEffect, useMemo, useState } from 'react';
import { interval, map } from 'rxjs';
import styled from 'styled-components';

import { getAccount } from 'app/cache/account';
import { getItemByIndex } from 'app/cache/item';
import { ModalWrapper } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { useNetwork, useVisibility } from 'app/stores';
import { SkillImages } from 'assets/images/skills';
import { ETH_INDEX, MUSU_INDEX, ONYX_INDEX } from 'constants/items';
import { queryAccountFromEmbedded } from 'network/shapes/Account';
import { getAllItems } from 'network/shapes/Item';

const SYNC_TIME = 1000;
const CurrencyIndices = [MUSU_INDEX, ETH_INDEX, ONYX_INDEX];

export function registerLootBoxModal() {
  registerUIComponent(
    'LootBox',
    // Grid Config
    {
      colStart: 36,
      colEnd: 68,
      rowStart: 3,
      rowEnd: 63,
    },
    // Requirement
    (layers) =>
      interval(1000).pipe(
        map(() => {
          const { network } = layers;
          const { world, components: comps, actions } = network;
          const accountEntity = queryAccountFromEmbedded(network);
          const accountOptions = { live: 1, config: 3600 };
          const tradeOptions = { state: 2, taker: 2 };

          return {
            network,
            data: {
              account: getAccount(world, comps, accountEntity, accountOptions),
            },
            types: {
              ActionComp: actions.Action,
            },
            utils: {
              entityToIndex: (id: EntityID) => world.entityToIndex.get(id)!,
              getAllItems: () => getAllItems(world, comps),
              getAccount: () => getAccount(world, comps, accountEntity, accountOptions),
              getItemByIndex: (index: number) => getItemByIndex(world, comps, index),
            },
          };
        })
      ),

    // Render
    ({ network, data, types, utils }) => {
      const { actions } = network;
      const { account } = data;
      const { getAllItems } = utils;
      const { modals } = useVisibility();
      const { selectedAddress, apis } = useNetwork();

      const [tick, setTick] = useState(Date.now());

      // time trigger to use for periodic refreshes
      useEffect(() => {
        const updateSync = () => setTick(Date.now());
        const timerId = setInterval(updateSync, SYNC_TIME);
        return () => clearInterval(timerId);
      }, []);

      // sets trades upon opening modal
      useEffect(() => {
        if (!modals.trading) return;
      }, [modals.trading, tick]);

      const HeaderRenderer = useMemo(() => {
        return (
          <Header>
            <HeaderPart size={1.2}>EVERYTHING MUST GO!!! "Normal!" - Leonard</HeaderPart>
            <HeaderPart size={3.4} weight={'bolder'} spacing={-0.55}>
              Pop-Up Shop
            </HeaderPart>
            <HeaderPart size={1.2}>"Five stars!!" - Amy WE ACCEPT OBOLS</HeaderPart>
          </Header>
        );
      }, []);

      const FooterRenderer = useMemo(() => {
        return <Footer>'FOOTER' </Footer>;
      }, []);

      /////////////////
      // GETTERS

      /////////////////
      // ACTIONS

      return (
        <ModalWrapper
          id='lootBox'
          header={HeaderRenderer}
          footer={FooterRenderer}
          noPadding
          overlay
        >
          <Content>
            Demon Egg
            <Img src={SkillImages.self_care} />
            <Text> X Obols</Text>
            <ButtonsRow>
              <Button onClick={() => {}}>I accept.</Button>
              <Button onClick={() => {}}>I refuse.</Button>
            </ButtonsRow>
          </Content>
        </ModalWrapper>
      );
    }
  );
}

const Content = styled.div`
  position: relative;
  gap: 0.6vw;
  flex-grow: 1;
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  overflow-x: hidden;
  overflow-y: auto;
  background-color: black;
  color: white;
  border: 0.3vw solid white;
  align-items: center;
  padding: 2vw;
`;

const Header = styled.div`
  position: relative;
  background-color: black;
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-around;
  align-items: center;
  gap: 0.5vw;
  padding: 1vw;
  padding-bottom: 0;
  flex-direction: column;
  line-height: 1vw;
  border: 0.3vw solid white;
  border-bottom: none;
  border-radius: 1vw 1vw 0 0;
`;
const HeaderPart = styled.div<{ size: number; weight?: string; spacing?: number }>`
  position: relative;
  color: white;
  padding: 0.5vw;
  letter-spacing: ${({ spacing }) => spacing || -0.25}vw;
  font-size: ${({ size }) => size}vw;
  font-weight: ${({ weight }) => weight || 'normal'};
`;

const Footer = styled.div`
  position: relative;
  background-color: black;
  color: white;
  border: 0.3vw solid white;
  border-top: none;
  border-radius: 0 0 1vw 1vw;
  height: 4vw;
`;

const ButtonsRow = styled.div`
  position: relative;
  width: 100%;
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  align-items: center;
  gap: 0.5vw;
  padding: 0.5vw;
`;

const Button = styled.button`
  border: 0.2vw solid white;
  background-color: black;
  color: white;
  padding: 0.5vw;
`;

const Img = styled.img`
  width: 6vw;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
  padding: 0.5vw;
`;

const Text = styled.text`
  color: white;
`;
