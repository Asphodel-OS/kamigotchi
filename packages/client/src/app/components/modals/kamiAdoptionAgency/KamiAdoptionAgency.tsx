import { EntityIndex } from 'engine/recs';
import { useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useReadContract } from 'wagmi';

import NewbieVendorBuySystem from 'abi/NewbieVendorBuySystem.json';
import { getAccount as _getAccount, getAccountKamis as _getAccountKamis } from 'app/cache/account';
import { IconButton, ModalWrapper } from 'app/components/library';
import { ListingCard } from 'app/components/modals/marketplace/tabs/listings/ListingCard';
import { useLayers } from 'app/root/hooks';
import { UIComponent } from 'app/root/types';
import { useNetwork, useSelected, useVisibility } from 'app/stores';
import { queryAccountFromEmbedded } from 'network/shapes/Account';
import { getKami as _getKami } from 'network/shapes/Kami';
import { getDisplayedKamis as _getDisplayedKamis } from 'network/shapes/NewbieVendor/queries';
import { getSystemAddr } from 'network/shapes/utils';
import { didActionSucceed } from 'network/utils';
import { formatEthPriceLabel, parseBigIntSafe } from 'utils/numbers';
import { type Abi } from 'viem';

const NEWBIE_VENDOR_BUY_SYSTEM_ID = 'system.newbievendor.buy';
const NEWBIE_VENDOR_MAX_ACCOUNT_AGE_SECONDS = 24 * 60 * 60;
const getNowInSeconds = () => Math.floor(Date.now() / 1000);
export const KamiAdoptionAgency: UIComponent = {
  id: 'KamiAdoptionAgencyModal',
  Render: () => {
    const { network } = useLayers();
    const { world, components, actions } = network;
    const accountEntity = queryAccountFromEmbedded(network);

    /////////////////
    // PREPARATION

    const newbieVendorSystemAddress = getSystemAddr(world, components, NEWBIE_VENDOR_BUY_SYSTEM_ID);
    const getDisplayedKamiEntities = (): EntityIndex[] => _getDisplayedKamis(world, components);
    const getKami = (entity: EntityIndex) =>
      _getKami(world, components, entity, { stats: true, traits: true, progress: true });
    const hasAnyKamis = () => _getAccountKamis(world, components, accountEntity).length > 0;
    const isAccountWithin24Hours = () => {
      const creation = _getAccount(world, components, accountEntity)?.time?.creation;
      if (typeof creation !== 'number' || !Number.isFinite(creation)) return false;
      const now = getNowInSeconds();
      return now - creation <= NEWBIE_VENDOR_MAX_ACCOUNT_AGE_SECONDS;
    };

    const isModalOpen = useVisibility((s) => s.modals.kamiAdoptionAgency);
    const apis = useNetwork((s) => s.apis);
    const selectedAddress = useNetwork((s) => s.selectedAddress);
    const kamiModalOpen = useVisibility((s) => s.modals.kami);
    const setModals = useVisibility((s) => s.setModals);
    const kamiIndex = useSelected((s) => s.kamiIndex);
    const setKami = useSelected((s) => s.setKami);
    const [buyingKamiIndex, setBuyingKamiIndex] = useState<number | null>(null);
    const [completedAdoptionsByAddress, setCompletedAdoptionsByAddress] = useState<
      Record<string, boolean>
    >({});
    const displayedKamis = useMemo(() => {
      return getDisplayedKamiEntities().map((entity) => getKami(entity));
    }, [world, components]);
    const ownerApi = apis.get(selectedAddress);
    const hasCompletedAdoption = useMemo(
      () => (selectedAddress ? !!completedAdoptionsByAddress[selectedAddress] : false),
      [completedAdoptionsByAddress, selectedAddress]
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
    const priceWei = useMemo(() => parseBigIntSafe(priceData), [priceData]);
    const priceLabel = useMemo(() => formatEthPriceLabel(priceData, 5), [priceData]);
    const isBuyDisabled = useMemo(
      () =>
        hasCompletedAdoption ||
        userHasKami ||
        !userAccountIsWithin24Hours ||
        buyingKamiIndex !== null ||
        !systemAddress ||
        priceWei === undefined ||
        !ownerApi,
      [
        buyingKamiIndex,
        hasCompletedAdoption,
        ownerApi,
        priceWei,
        systemAddress,
        userAccountIsWithin24Hours,
        userHasKami,
      ]
    );
    const userQualifiesForAdoption = useMemo(
      () => !hasCompletedAdoption && !userHasKami && userAccountIsWithin24Hours,
      [hasCompletedAdoption, userHasKami, userAccountIsWithin24Hours]
    );
    const adoptionBadgeMessage = useMemo(
      () =>
        !userQualifiesForAdoption
          ? "You don't qualify for the adoption agency."
          : 'You can only adopt one so choose wisely!',
      [userQualifiesForAdoption]
    );

    /////////////////
    // ACTIONS

    const buyKami = useCallback(
      async (kamiIndex: number, kamiName: string) => {
        if (!systemAddress || priceWei === undefined || !ownerApi) return;
        setBuyingKamiIndex(kamiIndex);
        try {
          const latestPriceRaw = (await refetchPrice()).data ?? priceData;
          const latestPrice = parseBigIntSafe(latestPriceRaw);
          if (latestPrice === undefined) return;
          const latestPriceWei = (latestPrice * 101n) / 100n;

          const transaction = actions.add({
            action: 'NewbieVendorBuy',
            params: [kamiIndex, latestPriceWei.toString()],
            description: `Adopting ${kamiName}`,
            execute: async () => ownerApi.newbieVendor.buy(kamiIndex, latestPriceWei),
          });
          const didComplete = await didActionSucceed(actions.Action, transaction);
          if (didComplete && selectedAddress) {
            setCompletedAdoptionsByAddress((prev) => ({ ...prev, [selectedAddress]: true }));
            refetchPrice();
          }
        } finally {
          setBuyingKamiIndex(null);
        }
      },
      [actions, ownerApi, priceData, priceWei, refetchPrice, selectedAddress, systemAddress]
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

    const headerRenderer = (
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
        header={headerRenderer}
      >
        <Content>
          {displayedKamis.length > 0 && <BodyText>Choose one</BodyText>}
          {displayedKamis.length > 0 && (
            <AdoptionBadge $warning={!userQualifiesForAdoption}>
              {adoptionBadgeMessage}
            </AdoptionBadge>
          )}
          <KamiGrid>
            {displayedKamis.map((kami) => (
              <KamiTile key={kami.entity}>
                <ListingCard
                  variant='adoption'
                  kami={kami}
                  priceLabel={priceLabel}
                  onOpenKami={openKamiModal}
                />
                <IconButton
                  text='Buy Kami'
                  fullWidth
                  scale={2.3}
                  disabled={isBuyDisabled}
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
  padding-top: 0.3vw;
  padding-left: 0.5vw;
  margin-bottom: ${({ weight }) => (weight === 'bolder' ? '0.3vw' : '0')};
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
  padding: 1vw;
  font-size: 1vw;
`;

const BodyText = styled.div`
  font-size: 0.85vw;
  font-weight: bold;
`;

const AdoptionBadge = styled.div<{ $warning: boolean }>`
  padding: 0.35vw 0.7vw;
  border: 0.15vw solid #000000;
  border-radius: 0.5vw;
  background-color: ${({ $warning }) => ($warning ? '#f8d6d6' : '#fff1bf')};
  font-size: 0.75vw;
  font-weight: bold;
  line-height: 1.1vw;
  text-align: center;
`;

const KamiGrid = styled.div`
  width: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(7.8vw, 1fr));
  align-content: start;
  gap: 0.5vw;
  padding: 0.4vw;
`;

const KamiTile = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35vw;
`;
