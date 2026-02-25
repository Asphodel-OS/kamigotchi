import styled from 'styled-components';

import { EmptyText, IconButton, TextTooltip } from 'app/components/library';
import { TokenIcons } from 'assets/images/tokens';
import { Kami } from 'network/shapes/Kami';
import { KamiMarketListing } from 'clients/kamiden';

export const ListingsListView = ({
  listings,
  formatPrice,
  formatExpiry,
  isOwnListing,
  isListingExpired,
  isInCart,
  onAddToCart,
  onRemoveFromCart,
  onCancelListing,
  onOpenKami,
  getAccountByID,
  loading,
}: {
  listings: { listing: KamiMarketListing; kami?: Kami }[];
  formatPrice: (weiString: string) => string;
  formatExpiry: (expiryStr: string) => string;
  isOwnListing: (listing: KamiMarketListing) => boolean;
  isListingExpired: (expiryStr: string) => boolean;
  isInCart: (orderId: string) => boolean;
  onAddToCart: (listing: KamiMarketListing) => void;
  onRemoveFromCart: (orderId: string) => void;
  onCancelListing: (orderId: string) => void;
  onOpenKami: (index: number) => void;
  getAccountByID: (id: string) => { name: string; index: number };
  loading?: boolean;
}) => {
  return (
    <>
      <HeaderRow>
        <Column flex={2}>
          <ColumnHeader>Kami</ColumnHeader>
        </Column>
        <Column>
          <ColumnHeader>Seller</ColumnHeader>
        </Column>
        <Column>
          <ColumnHeader>
            <EthIcon src={TokenIcons.eth} alt='ETH' />
          </ColumnHeader>
        </Column>
        <Column>
          <ColumnHeader>Expiry</ColumnHeader>
        </Column>
        <Column>
          <ColumnHeader>Actions</ColumnHeader>
        </Column>
      </HeaderRow>
      <ListingsBody>
        {listings.length === 0 && !loading && (
          <EmptyCenter>
            <EmptyText text={['No listings found']} size={0.9} />
          </EmptyCenter>
        )}
        {listings.map(({ listing, kami }) => (
          <Row key={listing.OrderID}>
            <Column flex={2}>
              <KamiCell>
                {kami && (
                  <KamiThumbnail
                    src={kami.image}
                    alt={kami.name}
                    onClick={() => onOpenKami(listing.KamiIndex)}
                  />
                )}
                <KamiName>{kami?.name ?? `Kami #${listing.KamiIndex}`}</KamiName>
              </KamiCell>
            </Column>
            <Column>
              <CellText>{getAccountByID(listing.SellerAccountID).name || 'Unknown'}</CellText>
            </Column>
            <Column>
              <CellText>{formatPrice(listing.Price)}</CellText>
            </Column>
            <Column>
              <CellText>{formatExpiry(listing.Expiry)}</CellText>
            </Column>
            <Column>
              {isOwnListing(listing) ? (
                <IconButton
                  text='Cancel'
                  onClick={() => onCancelListing(listing.OrderID)}
                  color='#FDECEC'
                />
              ) : isListingExpired(listing.Expiry) ? (
                <TextTooltip text={['Listing expired']}>
                  <IconButton text='x' disabled />
                </TextTooltip>
              ) : isInCart(listing.OrderID) ? (
                <IconButton
                  text='Remove'
                  onClick={() => onRemoveFromCart(listing.OrderID)}
                  color='#FDECEC'
                />
              ) : (
                <IconButton
                  text='Add'
                  onClick={() => onAddToCart(listing)}
                  color='#E8F5E9'
                />
              )}
            </Column>
          </Row>
        ))}
      </ListingsBody>
    </>
  );
};

const HeaderRow = styled.div`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  width: 100%;
  min-height: 3vw;
`;

const ListingsBody = styled.div`
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  flex: 1;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const EmptyCenter = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  width: 100%;
`;

const Row = styled.div`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  flex-shrink: 0;
  width: 100%;
  border-bottom: 0.06vw solid #ccc;
  min-height: 3vw;
  margin: 0.2vw 0;

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
  padding: 0.4vw 0.6vw;
  font-size: 1.05vw;
  line-height: 1.2;
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
  width: 11vw;
`;

const KamiThumbnail = styled.img`
  width: 3vw;
  height: 3vw;
  flex-shrink: 0;
  border-radius: 0.3vw;
  border: 0.1vw solid black;
  image-rendering: pixelated;
  cursor: pointer;
`;

const KamiName = styled.span`
  font-size: 0.9vw;
  white-space: nowrap;
`;

const CellText = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.95vw;
  line-height: 1.2;
  padding: 0.4vw 0.6vw;
`;
