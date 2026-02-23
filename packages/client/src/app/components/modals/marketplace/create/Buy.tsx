import { useMemo, useState } from 'react';
import styled from 'styled-components';
import { formatUnits, parseEther } from 'viem';

import { IconListButton, IconListButtonOption } from 'app/components/library';
import placeholderKami from 'assets/images/kamis/placeholderKami.gif';
import { MenuIcons } from 'assets/images/icons/menu';
import { TokenIcons } from 'assets/images/tokens';
import { Kami } from 'network/shapes/Kami';
import { playClick } from 'utils/sounds';
import { ExpirySlider } from './ExpirySlider';

type BidMode = 'generic' | 'specific';

export const Buy = ({
  isVisible,
  quantity,
  setQuantity,
  price,
  setPrice,
  expiration,
  setExpiration,
  kamiOptions,
  selectedBuyKami,
  onClearBuyKami,
}: {
  isVisible: boolean;
  quantity: string;
  setQuantity: (val: string) => void;
  price: string;
  setPrice: (val: string) => void;
  expiration: number;
  setExpiration: (val: number) => void;
  kamiOptions: IconListButtonOption[];
  selectedBuyKami: Kami | null;
  onClearBuyKami: () => void;
}) => {
  const [bidMode, setBidMode] = useState<BidMode>('generic');

  const handleModeSwitch = (mode: BidMode) => {
    if (mode === bidMode) return;
    playClick();
    setPrice('');
    if (mode === 'generic') {
      onClearBuyKami();
    } else {
      setQuantity('');
    }
    setBidMode(mode);
  };

  const perKamiDisplay = useMemo(() => {
    if (!price || !quantity) return null;
    const qty = Number(quantity);
    if (qty <= 0) return null;
    try {
      const totalWei = parseEther(price);
      const perKamiWei = totalWei / BigInt(qty);
      const num = Number(formatUnits(perKamiWei, 18));
      if (num > 0 && num < 0.00001) return '<0.00001';
      return num.toFixed(5).replace(/\.?0+$/, '');
    } catch {
      return null;
    }
  }, [price, quantity]);

  return (
    <Conditional isVisible={isVisible}>
      <MainLayout>
        <BidTypeColumn>
          <BidTypeTitle>Bid Type</BidTypeTitle>
          <BidTypeRow>
            <BidTypeOption
              $active={bidMode === 'generic'}
              onClick={() => handleModeSwitch('generic')}
            >
              <BidTypeImage src={placeholderKami} alt='Generic' />
              <BidTypeLabel>Generic</BidTypeLabel>
            </BidTypeOption>
            <BidTypeOption
              $active={bidMode === 'specific'}
              onClick={() => handleModeSwitch('specific')}
            >
              <BidTypeImage
                src={selectedBuyKami?.image ?? MenuIcons.kami}
                alt='Specific'
                $isIcon={!selectedBuyKami}
              />
              <BidTypeLabel>Specific</BidTypeLabel>
            </BidTypeOption>
          </BidTypeRow>
        </BidTypeColumn>

        <VerticalDivider />

        <FieldsColumn>
          {bidMode === 'generic' && (
            <>
              <FieldGroup>
                <SectionLabel>Quantity</SectionLabel>
                <InputRow>
                  <StyledInput
                    type='text'
                    inputMode='numeric'
                    placeholder='0'
                    value={quantity}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || /^\d+$/.test(val)) setQuantity(val);
                    }}
                  />
                  <InputIcon src={MenuIcons.kami} alt='Kami' />
                </InputRow>
              </FieldGroup>
              <FieldGroup>
                <SectionLabel>Total Bid</SectionLabel>
                <TotalBidRow>
                  <InputRow>
                    <StyledInput
                      type='text'
                      inputMode='decimal'
                      placeholder='0'
                      value={price}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || /^\d*\.?\d{0,18}$/.test(val)) setPrice(val);
                      }}
                    />
                    <InputIcon src={TokenIcons.eth} alt='ETH' />
                  </InputRow>
                  <PerKamiChip>
                    <PerKamiLabel>Per Kami:</PerKamiLabel>
                    <PerKamiIcon src={TokenIcons.eth} alt='ETH' />
                    <PerKamiValue>{perKamiDisplay ?? '—'}</PerKamiValue>
                  </PerKamiChip>
                </TotalBidRow>
              </FieldGroup>
            </>
          )}

          {bidMode === 'specific' && (
            <>
              <FieldGroup>
                <SectionLabel>Select Kami</SectionLabel>
                <KamiPickerRow>
                  <IconListButton
                    img={selectedBuyKami?.image ?? MenuIcons.kami}
                    options={kamiOptions}
                    searchable
                    tooltip={{ text: ['Select Kami'] }}
                  />
                  {selectedBuyKami && (
                    <SelectedKamiName>{selectedBuyKami.name}</SelectedKamiName>
                  )}
                </KamiPickerRow>
              </FieldGroup>
              <FieldGroup>
                <SectionLabel>Bid Amount</SectionLabel>
                <InputRow>
                  <StyledInput
                    type='text'
                    inputMode='decimal'
                    placeholder='0'
                    value={price}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || /^\d*\.?\d{0,18}$/.test(val)) setPrice(val);
                    }}
                  />
                  <InputIcon src={TokenIcons.eth} alt='ETH' />
                </InputRow>
              </FieldGroup>
            </>
          )}

          <FieldGroup>
            <SectionLabel>Choose Expiration</SectionLabel>
            <ExpirySlider expirationHours={expiration} setExpirationHours={setExpiration} />
          </FieldGroup>
        </FieldsColumn>
      </MainLayout>
    </Conditional>
  );
};

const Conditional = styled.div<{ isVisible: boolean }>`
  ${({ isVisible }) => (isVisible ? `` : `display: none;`)}
`;

const MainLayout = styled.div`
  display: flex;
  padding: 0.5vw 0.6vw;
  gap: 0;
`;

const BidTypeColumn = styled.div`
  flex: 0 0 25%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3vw;
  padding-right: 0.5vw;
`;

const BidTypeTitle = styled.span`
  font-weight: bold;
  font-size: 0.8vw;
`;

const BidTypeRow = styled.div`
  display: flex;
  gap: 0.3vw;
  width: 100%;
`;

const BidTypeOption = styled.div<{ $active: boolean }>`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15vw;
  cursor: pointer;
  padding: 0.15vw 0.15vw 0.2vw;
  border-radius: 0.4vw;
  border: 0.15vw solid ${({ $active }) => ($active ? '#7aa8d4' : '#ddd')};
  background: ${({ $active }) => ($active ? '#E0EEFF' : '#f0f0f0')};
  opacity: ${({ $active }) => ($active ? 1 : 0.5)};
  transition: all 0.15s;
  overflow: hidden;

  &:hover {
    opacity: 1;
  }
`;

const BidTypeImage = styled.img<{ $isIcon?: boolean }>`
  width: 100%;
  aspect-ratio: 1;
  border-radius: 0.25vw;
  image-rendering: pixelated;
  object-fit: ${({ $isIcon }) => ($isIcon ? 'contain' : 'cover')};
  padding: ${({ $isIcon }) => ($isIcon ? '15%' : '0')};
  background: white;
`;

const BidTypeLabel = styled.span`
  font-size: 0.55vw;
  font-weight: 600;
  color: #555;
`;

const VerticalDivider = styled.div`
  width: 0.08vw;
  background: #ddd;
  align-self: stretch;
`;

const FieldsColumn = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5vw;
  padding-left: 0.6vw;
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3vw;
`;

const SectionLabel = styled.div`
  font-weight: bold;
  font-size: 0.8vw;
  padding-bottom: 0.2vw;
  border-bottom: 0.08vw solid #ddd;
`;

const TotalBidRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5vw;
`;

const InputRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4vw;
`;

const StyledInput = styled.input`
  font-size: 1vw;
  width: 6vw;
  height: 2.5vw;
  padding: 0.3vw 0.4vw;
  border: 0.15vw solid black;
  border-radius: 0.6vw;
  outline: none;
  background: white;

  &:disabled {
    background: #e9e9e9;
    color: #666;
    cursor: not-allowed;
  }
`;

const InputIcon = styled.img`
  width: 1.4vw;
  height: 1.4vw;
`;

const PerKamiChip = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25vw;
  padding: 0.3vw 0.5vw;
  border-radius: 0.3vw;
  background: #f0f4f0;
  border: 0.06vw solid #d0d8d0;
  width: fit-content;
`;

const PerKamiLabel = styled.span`
  font-size: 0.7vw;
  color: #666;
`;

const PerKamiIcon = styled.img`
  width: 0.9vw;
  height: 0.9vw;
`;

const PerKamiValue = styled.span`
  font-size: 0.75vw;
  font-weight: 700;
`;

const KamiPickerRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6vw;

  & button {
    padding: 0 !important;
    overflow: hidden;
  }
  & button img {
    width: 100% !important;
    height: 100% !important;
    object-fit: cover;
    border-radius: 0.3vw;
    image-rendering: pixelated;
  }
`;

const SelectedKamiName = styled.span`
  font-weight: bold;
  font-size: 0.8vw;
  color: #222;
`;

