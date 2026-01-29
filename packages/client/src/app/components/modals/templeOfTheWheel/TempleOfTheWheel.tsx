import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { getAccountKamis } from 'app/cache/account';
import { isResting } from 'app/cache/kami';
import {
  IconListButton,
  IconListButtonOption,
  KamiCard,
  ModalWrapper,
} from 'app/components/library';
import { useLayers } from 'app/root/hooks';
import { UIComponent } from 'app/root/types';
import { useSelected, useVisibility } from 'app/stores';
import { hoverFx } from 'app/styles/effects';
import { queryAccountFromEmbedded } from 'network/shapes/Account';
import { Kami, NullKami } from 'network/shapes/Kami';
import {
  getRarePityProgress,
  getSacrificeTotal,
  getUncommonPityProgress,
} from 'network/shapes/Sacrifice/sacrifice';
import { didActionSucceed } from 'network/utils';
import { playClick, playSacrifice } from 'utils/sounds';
import { StatsDisplay } from '../node/kards/StatsDisplay';

export const TempleOfTheWheel: UIComponent = {
  id: 'TempleOfTheWheelModal',
  Render: () => {
    const layers = useLayers();

    const {
      network,
      utils: { getKamis, getUncommonPity, getRarePity, getTotalSacrifices },
    } = (() => {
      const { network } = layers;
      const { world, components } = network;
      const accountEntity = queryAccountFromEmbedded(network);
      const account = world.entities[accountEntity];

      return {
        network,
        utils: {
          getKamis: () =>
            getAccountKamis(world, components, accountEntity, { stats: 3600, traits: 3600 }),
          getUncommonPity: () => getUncommonPityProgress(world, components, account),
          getRarePity: () => getRarePityProgress(world, components, account),
          getTotalSacrifices: () => getSacrificeTotal(world, components),
        },
      };
    })();

    const { actions, api } = network;

    const templeOfTheWheelVisible = useVisibility((s) => s.modals.templeOfTheWheel);
    const setModals = useVisibility((s) => s.setModals);
    const [isDisabled, setIsDisabled] = useState(false);
    const [selectedKami, setSelectedKami] = useState<Kami>(NullKami);
    const [kamiOptions, setKamiOptions] = useState<IconListButtonOption[]>([]);

    /////////////////

    useEffect(() => {
      if (!templeOfTheWheelVisible) return;
      const kamis = getKamis();
      const restingKamis = kamis.filter((kami) => isResting(kami));
      const options = restingKamis.map((kami) => ({
        image: kami.image,
        text: kami.name,
        onClick: () => setSelectedKami(kami),
      }));
      setKamiOptions(options);
      setSelectedKami(NullKami); // reset selection on modal open
    }, [templeOfTheWheelVisible]);

    /////////////////
    // ACTIONS

    const sacrificeKami = async (kami: Kami) => {
      playClick();
      setIsDisabled(true);
      const transaction = actions.add({
        action: 'KamiSacrifice',
        params: [kami.index],
        description: `Sacrificing ${kami.name}`,
        execute: async () => {
          return api.player.pet.sacrificeCommit(kami.index);
        },
      });
      const completed = await didActionSucceed(actions.Action, transaction);
      if (completed) {
        playSacrifice();
        setSelectedKami(NullKami);
        useSelected.setState({ dialogueIndex: 194 });
        setModals({ dialogue: true });
      }
      setIsDisabled(false);
    };

    /////////////////
    // RENDERING
    const HeaderRenderer = (
      <Header>
        <HeaderRow position='flex-start'>
          <HeaderPart size={1}>Devotion through Sacrifice</HeaderPart>
        </HeaderRow>
        <HeaderPart size={2} spacing={-0.34}>
          Temple of the Wheel
        </HeaderPart>
        <HeaderRow position='flex-end'>
          <HeaderPart size={1}>Creation through destruction</HeaderPart>
        </HeaderRow>
      </Header>
    );

    const uncommonPity = getUncommonPity();
    const rarePity = getRarePity();
    const totalSacrifices = getTotalSacrifices();
    const FooterRenderer = (
      <Footer>
        <Text size={0.8}>
          <span style={{ color: 'red' }}>{uncommonPity.current}</span>/{uncommonPity.threshold}{' '}
          sacrifices for a guaranteed Uncommon!
        </Text>
        <Text size={0.8}>
          <span style={{ color: 'red' }}>{rarePity.current}</span>/{rarePity.threshold} sacrifices
          for a guaranteed Rare!
        </Text>
        <Text size={0.8}>
          Total Kami sacrificed worldwide: <span style={{ color: 'red' }}>{totalSacrifices}</span>
        </Text>
      </Footer>
    );

    return (
      <ModalWrapper
        id='templeOfTheWheel'
        header={HeaderRenderer}
        footer={FooterRenderer}
        noPadding
        overlay
        truncate
        canExit
        noInternalBorder
      >
        <Content>
          <Text spacing={-0.14}>Select your Sacrifice</Text>
          <SelectionRow>
            {selectedKami.entity === 0 ? (
              <IconListButton text='+' options={kamiOptions} searchable radius={0.6} />
            ) : (
              <SelectedKamiWrapper>
                <KamiCard
                  kami={selectedKami}
                  content={<StatsDisplay kami={selectedKami} />}
                  tick={0}
                />
                <CloseButton onClick={() => setSelectedKami(NullKami)}>✕</CloseButton>
              </SelectedKamiWrapper>
            )}
          </SelectionRow>
          <Text spacing={-0.14}>Receive a MicroKami</Text>
          <ButtonsRow>
            <Button
              disabled={isDisabled || selectedKami.entity === 0}
              onClick={() => sacrificeKami(selectedKami)}
            >
              Sacrifice this Kami
            </Button>
          </ButtonsRow>
        </Content>
      </ModalWrapper>
    );
  },
};

const Content = styled.div`
  position: relative;
  gap: 0.6vw;
  flex-grow: 1;
  display: flex;
  flex-flow: column nowrap;
  justify-content: space-around;
  overflow: hidden auto;
  background-color: white;
  color: black;
  border: 0.1vw solid black;
  align-items: center;
  padding: 2vw;
  font-size: 1vw;
  padding-bottom: 0.5vw;
  width: 100%;
  height: 100%;
`;

const Header = styled.div`
  position: relative;
  background-color: white;
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-around;
  align-items: center;
  gap: 0.5vw;
  padding: 1vw;
  padding-bottom: 0;
  flex-direction: column;
  line-height: 1vw;
  border: 0.1vw solid black;
  border-radius: 1vw 1vw 0 0;
`;

const HeaderRow = styled.div<{ position: string }>`
  display: flex;
  flex-flow: row nowrap;
  justify-content: ${({ position }) => position};
  width: 100%;
`;

const HeaderPart = styled.div<{ size: number; weight?: string; spacing?: number }>`
  position: relative;
  color: black;
  padding: 0.3vw;
  letter-spacing: ${({ spacing }) => spacing || -0.1}vw;
  font-size: ${({ size }) => size}vw;
  font-weight: ${({ weight }) => weight || 'normal'};
`;

const Footer = styled.div`
  display: flex;
  position: relative;
  flex-flow: column nowrap;
  justify-content: flex-start;
  align-items: left;
  gap: 0.3vw;
  background-color: white;
  color: black;
  border: 0.1vw solid black;
  border-radius: 0 0 1vw 1vw;
  height: 3.8vw;
  width: 100%;
  padding: 0.3vw;
`;

const ButtonsRow = styled.div`
  position: relative;
  width: 100%;
  display: flex;
  flex-flow: row nowrap;
  justify-content: center;
  align-items: center;
  gap: 0.5vw;
  padding: 0.5vw;
`;

const Button = styled.button`
  border: 0.1vw solid black;
  background-color: white;
  border-radius: 0.3vw;
  color: black;
  padding: 0.4vw;
  font-size: 0.8vw;
  letter-spacing: -0.1vw;
  &:hover:not(:disabled) {
    animation: ${() => hoverFx()} 0.2s;
    transform: scale(1.05);
    cursor: pointer;
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Text = styled.span<{ size?: number; weight?: string; spacing?: number }>`
  color: black;
  letter-spacing: ${({ spacing }) => spacing || -0.1}vw;
  ${({ size }) => (size ? `font-size: ${size}vw;` : '0.8vw;')}
  ${({ weight }) => (weight ? `font-weight: ${weight};` : 'normal;')}
`;

const SelectionRow = styled.div`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: center;
  gap: 1vw;
  width: 100%;
  height: 100%;
`;

const SelectedKamiWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`;

const CloseButton = styled.button`
  position: absolute;
  top: -0.5vw;
  right: -0.5vw;
  width: 1.2vw;
  height: 1.2vw;
  border-radius: 50%;
  border: 0.1vw solid black;
  background-color: white;
  color: black;
  font-size: 0.6vw;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover {
    background-color: #ddd;
  }
`;
