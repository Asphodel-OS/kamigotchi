import { EntityIndex } from 'engine/recs';
import { useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useReadContract } from 'wagmi';

import NewbieVendorBuySystem from 'abi/NewbieVendorBuySystem.json';
import { IconButton, ModalWrapper } from 'app/components/library';
import { ListingCard } from 'app/components/modals/marketplace/tabs/listings/ListingCard';
import { useLayers } from 'app/root/hooks';
import { UIComponent } from 'app/root/types';
import { useVisibility } from 'app/stores';
import { getKami as _getKami } from 'network/shapes/Kami';
import { getDisplayedKamis as _getDisplayedKamis } from 'network/shapes/NewbieVendor/queries';
import { getSystemAddr } from 'network/shapes/utils';
import { didActionSucceed } from 'network/utils';
import { formatEthPriceLabel } from 'utils/numbers';
import { type Abi } from 'viem';

const NEWBIE_VENDOR_BUY_SYSTEM_ID = 'system.newbievendor.buy';

export const KamiAdoptionAgency: UIComponent = {
  id: 'KamiAdoptionAgencyModal',
  Render: () => {
    const layers = useLayers();

    /////////////////
    // PREPARATION

    const { network, data, utils } = (() => {
      const { network } = layers;
      const { world, components } = network;

      return {
        network,
        data: {
          newbieVendorSystemAddress: getSystemAddr(world, components, NEWBIE_VENDOR_BUY_SYSTEM_ID),
        },
        utils: {
          getDisplayedKamiEntities: (): EntityIndex[] => _getDisplayedKamis(world, components),
          getKami: (entity: EntityIndex) =>
            _getKami(world, components, entity, { stats: true, traits: true, progress: true }),
          formatEthPrice: formatEthPriceLabel,
        },
      };
    })();

    /////////////////
    // INSTANTIATIONS

    const { actions, api } = network;
    const { newbieVendorSystemAddress } = data;
    const { getDisplayedKamiEntities, getKami, formatEthPrice } = utils;

    const isModalOpen = useVisibility((s) => s.modals.kamiAdoptionAgency);
    const [buyingKamiIndex, setBuyingKamiIndex] = useState<number | null>(null);
    const displayedKamis = useMemo(
      () => getDisplayedKamiEntities().map((entity) => getKami(entity)),
      [getDisplayedKamiEntities, getKami]
    );
    const systemAddress = newbieVendorSystemAddress;

    /////////////////
    // SUBSCRIPTIONS

    const { data: priceData } = useReadContract({
      address: systemAddress,
      abi: NewbieVendorBuySystem.abi as Abi,
      functionName: 'calcPrice',
      query: { enabled: isModalOpen && !!systemAddress },
    });

    const priceWei = useMemo(() => {
      try {
        return priceData === undefined || priceData === null
          ? undefined
          : BigInt(priceData.toString());
      } catch {
        return undefined;
      }
    }, [priceData]);

    const priceLabel = useMemo(() => formatEthPrice(priceData), [priceData, formatEthPrice]);

    /////////////////
    // ACTIONS

    const buyKami = useCallback(
      async (kamiIndex: number, kamiName: string) => {
        if (!systemAddress || priceWei === undefined) return;
        setBuyingKamiIndex(kamiIndex);
        try {
          const transaction = actions.add({
            action: 'NewbieVendorBuy',
            params: [kamiIndex, priceWei.toString()],
            description: `Adopting ${kamiName}`,
            execute: async () => api.player.newbieVendor.buy(kamiIndex, priceWei),
          });
          await didActionSucceed(actions.Action, transaction);
        } finally {
          setBuyingKamiIndex(null);
        }
      },
      [actions, api, priceWei, systemAddress]
    );

    /////////////////
    // RENDER

    const HeaderRenderer = (
      <Header>
        <HeaderPart size={1.7} weight={'bolder'} spacing={-0.12}>
          Kami Adoption Agency
        </HeaderPart>
        <HeaderRow>
          <HeaderPart size={1.1}>"A partner for life!"-Jenny</HeaderPart>
          <HeaderPart size={1.1}>Forever homes for Kami!</HeaderPart>
        </HeaderRow>
      </Header>
    );

    return (
      <ModalWrapper
        id='kamiAdoptionAgency'
        canExit
        noPadding
        overlay
        positionOverride={{
          colStart: 33,
          colEnd: 67,
          rowStart: 3,
          rowEnd: 99,
          position: 'fixed',
        }}
        truncate
        header={HeaderRenderer}
      >
        <Content>
          <KamiGrid>
            {displayedKamis.map((kami) => (
              <KamiTile key={kami.entity}>
                <ListingCard variant='adoption' kami={kami} priceLabel={priceLabel} />
                <IconButton
                  text='Buy Kami'
                  fullWidth
                  scale={2.3}
                  disabled={
                    !isModalOpen ||
                    !systemAddress ||
                    priceWei === undefined ||
                    buyingKamiIndex !== null
                  }
                  onClick={() => buyKami(kami.index, kami.name)}
                />
              </KamiTile>
            ))}
          </KamiGrid>
          {displayedKamis.length === 0 && (
            <BodyText>There are no Kami available for adoption right now.</BodyText>
          )}
        </Content>
      </ModalWrapper>
    );
  },
};

const Header = styled.div`
  position: relative;
  background-color: #ffffff;
  display: flex;
  justify-content: space-around;
  align-items: center;
  gap: 0.5vw;
  padding: 1vw;
  padding-bottom: 0;
  flex-direction: column;
  line-height: 1vw;
  border: 0.3vw solid #000000;
  border-bottom: none;
  border-radius: 1vw 1vw 0 0;
`;

const HeaderRow = styled.div`
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  width: 100%;
`;

const HeaderPart = styled.div<{ size: number; weight?: string; spacing?: number }>`
  position: relative;
  color: #000000;
  padding: 0.5vw;
  letter-spacing: ${({ spacing }) => spacing || -0.08}vw;
  font-size: ${({ size }) => size}vw;
  font-weight: ${({ weight }) => weight || 'normal'};
`;

const Content = styled.div`
  position: relative;
  gap: 0.6vw;
  flex-grow: 1;
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;
  overflow: hidden auto;
  background-color: #ffffff;
  color: #000000;
  border: 0.3vw solid #000000;
  border-top: none;
  border-radius: 0 0 1vw 1vw;
  box-sizing: border-box;
  padding: 2vw;
  font-size: 1vw;
  padding-bottom: 0.5vw;
`;

const BodyText = styled.div`
  font-size: 0.85vw;
  font-weight: bold;
`;

const KamiGrid = styled.div`
  width: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(7.8vw, 1fr));
  align-content: start;
  gap: 0.5vw;
  padding: 0.4vw;
  margin-top: 1vw;
`;

const KamiTile = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35vw;
`;
