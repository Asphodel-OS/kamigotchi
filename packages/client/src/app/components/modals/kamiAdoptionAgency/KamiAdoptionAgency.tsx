import { EntityIndex } from 'engine/recs';
import { useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useReadContract } from 'wagmi';

import NewbieVendorBuySystem from 'abi/NewbieVendorBuySystem.json';
import { getAccount as _getAccount, getAccountKamis as _getAccountKamis } from 'app/cache/account';
import { IconButton, ModalWrapper, TextTooltip } from 'app/components/library';
import { ListingCard } from 'app/components/modals/marketplace/tabs/listings/ListingCard';
import { useLayers } from 'app/root/hooks';
import { UIComponent } from 'app/root/types';
import { useNetwork, useSelected, useVisibility } from 'app/stores';
import { queryAccountFromEmbedded } from 'network/shapes/Account';
import { getKami as _getKami } from 'network/shapes/Kami';
import { getDisplayedKamis as _getDisplayedKamis } from 'network/shapes/NewbieVendor/queries';
import { getSystemAddr } from 'network/shapes/utils';
import { didActionSucceed } from 'network/utils';
import { formatEthPriceLabel } from 'utils/numbers';
import { type Abi } from 'viem';

const NEWBIE_VENDOR_BUY_SYSTEM_ID = 'system.newbievendor.buy';
const NEWBIE_VENDOR_MAX_ACCOUNT_AGE_SECONDS = 24 * 60 * 60;

export const KamiAdoptionAgency: UIComponent = {
  id: 'KamiAdoptionAgencyModal',
  Render: () => {
    const layers = useLayers();

    /////////////////
    // PREPARATION

    const { network, data, utils } = (() => {
      const { network } = layers;
      const { world, components } = network;
      const accountEntity = queryAccountFromEmbedded(network);

      return {
        network,
        data: {
          newbieVendorSystemAddress: getSystemAddr(world, components, NEWBIE_VENDOR_BUY_SYSTEM_ID),
        },
        utils: {
          getDisplayedKamiEntities: (): EntityIndex[] => _getDisplayedKamis(world, components),
          getKami: (entity: EntityIndex) =>
            _getKami(world, components, entity, { stats: true, traits: true, progress: true }),
          hasAnyKamis: () => _getAccountKamis(world, components, accountEntity).length > 0,
          isAccountWithin24Hours: () => {
            const creation = _getAccount(world, components, accountEntity).time.creation;
            const now = Math.floor(Date.now() / 1000);
            return now - creation <= NEWBIE_VENDOR_MAX_ACCOUNT_AGE_SECONDS;
          },
          formatEthPrice: formatEthPriceLabel,
        },
      };
    })();

    /////////////////
    // INSTANTIATIONS

    const { actions } = network;
    const { newbieVendorSystemAddress } = data;
    const {
      getDisplayedKamiEntities,
      getKami,
      hasAnyKamis,
      isAccountWithin24Hours,
      formatEthPrice,
    } = utils;

    const isModalOpen = useVisibility((s) => s.modals.kamiAdoptionAgency);
    const apis = useNetwork((s) => s.apis);
    const selectedAddress = useNetwork((s) => s.selectedAddress);
    const kamiModalOpen = useVisibility((s) => s.modals.kami);
    const setModals = useVisibility((s) => s.setModals);
    const kamiIndex = useSelected((s) => s.kamiIndex);
    const setKami = useSelected((s) => s.setKami);
    const [buyingKamiIndex, setBuyingKamiIndex] = useState<number | null>(null);
    const displayedKamis = useMemo(
      () => getDisplayedKamiEntities().map((entity) => getKami(entity)),
      [getDisplayedKamiEntities, getKami]
    );
    const userHasKami = hasAnyKamis();
    const userAccountIsWithin24Hours = isAccountWithin24Hours();
    const systemAddress = newbieVendorSystemAddress;

    /////////////////
    // SUBSCRIPTIONS

    const { data: priceData, refetch: refetchPrice } = useReadContract({
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
    const buyTooltipMessage = useMemo(() => {
      if (userHasKami) return 'You already have Kami.';
      if (!userAccountIsWithin24Hours) return 'Your account was created more than 24 hours ago.';
      return 'Purchase this Kami.';
    }, [userHasKami, userAccountIsWithin24Hours]);

    /////////////////
    // ACTIONS

    const buyKami = useCallback(
      async (kamiIndex: number, kamiName: string) => {
        if (!systemAddress || priceWei === undefined) return;
        setBuyingKamiIndex(kamiIndex);
        try {
          const ownerApi = apis.get(selectedAddress);
          if (!ownerApi) throw new Error(`API not established for ${selectedAddress}`);

          const latestPriceRaw = (await refetchPrice()).data ?? priceData;
          if (latestPriceRaw === undefined || latestPriceRaw === null) return;
          const latestPriceWei = BigInt(latestPriceRaw.toString());

          const transaction = actions.add({
            action: 'NewbieVendorBuy',
            params: [kamiIndex, latestPriceWei.toString()],
            description: `Adopting ${kamiName}`,
            execute: async () => ownerApi.newbieVendor.buy(kamiIndex, latestPriceWei),
          });
          await didActionSucceed(actions.Action, transaction);
        } finally {
          setBuyingKamiIndex(null);
        }
      },
      [actions, apis, priceData, priceWei, refetchPrice, selectedAddress, systemAddress]
    );

    const openKamiModal = useCallback(
      (index: number) => {
        const sameKami = kamiIndex === index;
        if (!sameKami) setKami(index);
        if (kamiModalOpen && sameKami) setModals({ kami: false });
        else setModals({ kami: true });
      },
      [kamiIndex, kamiModalOpen, setKami, setModals]
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
        truncate
        header={HeaderRenderer}
      >
        <Content>
          <KamiGrid>
            {displayedKamis.map((kami) => (
              <KamiTile key={kami.entity}>
                <ListingCard
                  variant='adoption'
                  kami={kami}
                  priceLabel={priceLabel}
                  onOpenKami={openKamiModal}
                />
                <TextTooltip text={[buyTooltipMessage]} delay={0} alignText='center'>
                  <IconButton
                    text='Buy Kami'
                    fullWidth
                    scale={2.3}
                    onClick={() => buyKami(kami.index, kami.name)}
                  />
                </TextTooltip>
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
  border: 0.15vw solid #000000;
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
  border: 0.15vw solid #000000;
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
