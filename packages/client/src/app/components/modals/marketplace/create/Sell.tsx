import { useMemo } from 'react';
import styled from 'styled-components';

import { IconListButton } from 'app/components/library';
import { MenuIcons } from 'assets/images/icons/menu';
import { TokenIcons } from 'assets/images/tokens';
import { Kami, NullKami } from 'network/shapes/Kami';
import { ExpirySlider } from './ExpirySlider';

export interface KamiOption {
  text: string;
  object: Kami;
  img: string;
}

export const Sell = ({
  isVisible,
  kamiOptions,
  handleKamiSelect,
  selectedKami,
  onKamiClick,
  price,
  setPrice,
  expiration,
  setExpiration,
  hasSellableKamis,
  disabledTooltip,
}: {
  isVisible: boolean;
  kamiOptions: KamiOption[];
  handleKamiSelect: (selected: Kami[]) => void;
  selectedKami: Kami[];
  onKamiClick: () => void;
  price: string;
  setPrice: (val: string) => void;
  expiration: number;
  setExpiration: (val: number) => void;
  hasSellableKamis: boolean;
  disabledTooltip: string;
}) => {
  const selected = selectedKami[0];
  const hasSelection = selected?.id !== NullKami.id;

  const iconListOptions = useMemo(
    () =>
      kamiOptions.map((opt) => ({
        text: opt.text,
        image: opt.img,
        onClick: () => handleKamiSelect([opt.object]),
      })),
    [kamiOptions, handleKamiSelect]
  );

  return (
    <Conditional isVisible={isVisible}>
      <MainLayout>
        <KamiPreviewColumn>
          <SectionLabel>Kami to List</SectionLabel>
          <KamiImage
            src={hasSelection ? selected.image : MenuIcons.kami}
            alt={hasSelection ? selected.name : 'Kami'}
            $isIcon={!hasSelection}
            $clickable={hasSelection}
            onClick={hasSelection ? onKamiClick : undefined}
          />
        </KamiPreviewColumn>

        <VerticalDivider />

        <FieldsColumn>
          <FieldGroup>
            <SectionLabel>Select Kami</SectionLabel>
            <KamiPickerRow>
              <IconListButton
                img={hasSelection ? selected.image : MenuIcons.kami}
                options={iconListOptions}
                searchable
                tooltip={{
                  text: hasSellableKamis ? ['Select Kami'] : [disabledTooltip],
                }}
                disabled={!hasSellableKamis}
              />
              {hasSelection && <SelectedKamiName>{selected.name}</SelectedKamiName>}
            </KamiPickerRow>
          </FieldGroup>
          <FieldRow>
            <RowFieldGroup>
              <SectionLabel>Listing Price</SectionLabel>
              <InputRow>
                <StyledInput
                  type='text'
                  inputMode='decimal'
                  placeholder='Enter Price'
                  value={price}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || /^\d*\.?\d{0,6}$/.test(val)) {
                      if (val !== '' && Number(val) > 100) return;
                      setPrice(val);
                    }
                  }}
                  onBlur={() => {
                    if (price === '') return;
                    let val = price;
                    if (Number(val) > 0 && Number(val) < 0.001) val = '0.001';
                    if (val.includes('.')) val = val.replace(/0+$/, '').replace(/\.$/, '');
                    if (val !== price) setPrice(val);
                  }}
                />
                <InputIcon src={TokenIcons.eth} alt='ETH' />
              </InputRow>
            </RowFieldGroup>
            <RowFieldGroup>
              <SectionLabel>Choose Expiration</SectionLabel>
              <ExpirySlider expirationHours={expiration} setExpirationHours={setExpiration} />
            </RowFieldGroup>
          </FieldRow>
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

const KamiPreviewColumn = styled.div`
  flex: 0 0 25%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3vw;
  padding-right: 0.5vw;
`;

const KamiImage = styled.img<{ $isIcon?: boolean; $clickable?: boolean }>`
  width: 50%;
  aspect-ratio: 1;
  border-radius: 0.4vw;
  image-rendering: pixelated;
  object-fit: ${({ $isIcon }) => ($isIcon ? 'contain' : 'cover')};
  padding: ${({ $isIcon }) => ($isIcon ? '15%' : '0')};
  background: white;
  border: 0.15vw solid #ddd;
  cursor: ${({ $clickable }) => ($clickable ? 'pointer' : 'default')};

  &:hover {
    opacity: ${({ $clickable }) => ($clickable ? 0.75 : 1)};
  }
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

const FieldRow = styled.div`
  display: flex;
  gap: 0.8vw;
  flex-wrap: wrap;
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3vw;
`;

const RowFieldGroup = styled(FieldGroup)`
  flex: 1;
  min-width: 12vw;
`;

const SectionLabel = styled.div`
  font-weight: bold;
  font-size: 0.8vw;
  padding-bottom: 0.2vw;
  border-bottom: 0.08vw solid #ddd;
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

const InputRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4vw;
`;

const StyledInput = styled.input`
  font-size: 1vw;
  width: 10vw;
  height: 2.5vw;
  padding: 0.3vw 0.6vw;
  border: 0.15vw solid black;
  border-radius: 0.6vw;
  outline: none;
  background: white;
  text-align: center;
  caret-color: transparent;

  &::placeholder {
    color: transparent;
    font-size: 0.8vw;
  }

  &:focus {
    border-width: 0.25vw;
    background: #FFF9E0;
  }

  &:focus::placeholder {
    color: #aaa;
  }
`;

const InputIcon = styled.img`
  width: 1.4vw;
  height: 1.4vw;
`;
