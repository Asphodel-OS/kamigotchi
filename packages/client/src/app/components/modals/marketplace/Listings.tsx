import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { formatUnits } from 'viem';

import FilterListIcon from '@mui/icons-material/FilterList';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import { EmptyText, IconButton, IconListButton, TextTooltip } from 'app/components/library';
import { getKamidenClient, KamiMarketListing } from 'clients/kamiden';
import { TokenIcons } from 'assets/images/tokens';
import { EntityIndex } from 'engine/recs';
import { Kami } from 'network/shapes/Kami';

const KamidenClient = getKamidenClient();

const formatPrice = (weiString: string) => {
  if (!weiString || weiString === '0') return '0';
  const num = Number(formatUnits(BigInt(weiString), 18));
  if (num < 0.001) return '<0.001';
  return num.toFixed(3);
};

const formatExpiry = (expiryStr: string) => {
  const expiry = Number(expiryStr);
  if (expiry === 0) return 'Never';
  const diff = expiry - Math.floor(Date.now() / 1000);
  if (diff <= 0) return 'Expired';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
};

export const Listings = ({
  isVisible,
  onOpenFilter,
  utils,
}: {
  isVisible: boolean;
  onOpenFilter: () => void;
  utils: {
    queryKamiByIndex: (index: number) => EntityIndex | undefined;
    getKami: (entity: EntityIndex) => Kami;
  };
}) => {
  const [listings, setListings] = useState<KamiMarketListing[]>([]);
  const [sortBy, setSortBy] = useState('Latest');

  useEffect(() => {
    if (!isVisible || !KamidenClient) return;
    KamidenClient.getKamiMarketListings({}).then((res) => setListings(res.Listings ?? []));
  }, [isVisible]);

  const resolvedListings = useMemo(
    () =>
      listings.map((listing) => {
        const entity = utils.queryKamiByIndex(listing.KamiIndex);
        const kami = entity !== undefined ? utils.getKami(entity) : undefined;
        return { listing, kami };
      }),
    [listings]
  );

  const sorted = useMemo(() => {
    const copy = [...resolvedListings];
    if (sortBy === 'Price Low')
      return copy.sort((a, b) => Number(BigInt(a.listing.Price) - BigInt(b.listing.Price)));
    if (sortBy === 'Price High')
      return copy.sort((a, b) => Number(BigInt(b.listing.Price) - BigInt(a.listing.Price)));
    return copy.sort((a, b) => b.listing.Timestamp - a.listing.Timestamp);
  }, [resolvedListings, sortBy]);

  const sortOptions = [
    { text: 'Latest', onClick: () => setSortBy('Latest') },
    { text: 'Price Low', onClick: () => setSortBy('Price Low') },
    { text: 'Price High', onClick: () => setSortBy('Price High') },
  ];

  return (
    <Tab isVisible={isVisible}>
      <ButtonWrapper>
        <TextTooltip text={['Sorting']}>
          <IconListButton
            img={SwapVertIcon as any}
            text={sortBy}
            options={sortOptions}
            radius={0.6}
          />
        </TextTooltip>
        <TextTooltip text={['Filters']}>
          <IconButton img={FilterListIcon} onClick={onOpenFilter} />
        </TextTooltip>
        <TextTooltip text={['Cart']}>
          <IconButton img={ShoppingCartIcon} onClick={() => {}} />
        </TextTooltip>
      </ButtonWrapper>
      <HeaderRow>
        <Column flex={2}>
          <ColumnHeader>Kami</ColumnHeader>
        </Column>
        <Column>
          <ColumnHeader>
            <EthIcon src={TokenIcons.eth} alt='ETH' />
          </ColumnHeader>
        </Column>
        <Column>
          <ColumnHeader>Expiry</ColumnHeader>
        </Column>
      </HeaderRow>
      {sorted.length === 0 && <EmptyText text={['No listings found']} size={0.9} />}
      {sorted.map(({ listing, kami }) => (
        <Row key={listing.OrderID}>
          <Column flex={2}>
            <KamiCell>
              {kami && <KamiThumbnail src={kami.image} alt={kami.name} />}
              <KamiName>{kami?.name ?? `Kami #${listing.KamiIndex}`}</KamiName>
            </KamiCell>
          </Column>
          <Column>
            <CellText>{formatPrice(listing.Price)}</CellText>
          </Column>
          <Column>
            <CellText>{formatExpiry(listing.Expiry)}</CellText>
          </Column>
        </Row>
      ))}
    </Tab>
  );
};

const Tab = styled.div<{ isVisible: boolean }>`
  ${({ isVisible }) => (isVisible ? `display: flex;` : `display: none;`)}
  flex-direction: column;
  flex: 1;
  overflow: auto;
  width: 100%;
  min-height: 10vw;
`;

const ButtonWrapper = styled.div`
  display: flex;
  gap: 0.4vw;
  padding: 0.4vw;
  width: fit-content;
`;

const HeaderRow = styled.div`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  width: 100%;
  border-bottom: 0.15vw solid black;
`;

const Row = styled.div`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  width: 100%;
  border-bottom: 0.06vw solid #ccc;

  &:hover {
    background-color: #eee;
  }
`;

const Column = styled.div<{ flex?: number }>`
  display: flex;
  align-items: center;
  justify-content: center;
  flex: ${({ flex }) => flex ?? 1};
`;

const ColumnHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.8vw;
  font-size: 1.1vw;
`;

const EthIcon = styled.img`
  width: 1.4vw;
  height: 1.4vw;
`;

const KamiCell = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4vw;
  padding: 0.4vw;
`;

const KamiThumbnail = styled.img`
  width: 3vw;
  height: 3vw;
  border-radius: 0.3vw;
  border: 0.1vw solid black;
  image-rendering: pixelated;
`;

const KamiName = styled.span`
  font-size: 0.9vw;
`;

const CellText = styled.span`
  font-size: 0.9vw;
  padding: 0.4vw;
`;
