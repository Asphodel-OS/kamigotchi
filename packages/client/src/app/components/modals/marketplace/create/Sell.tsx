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
          <FieldGroup>
            <SectionLabel>Listing Price</SectionLabel>
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

const KamiPickerRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6vw;
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
  width: 6vw;
  height: 2.5vw;
  padding: 0.3vw 0.4vw;
  border: 0.15vw solid black;
  border-radius: 0.6vw;
  outline: none;
  background: white;
`;

const InputIcon = styled.img`
  width: 1.4vw;
  height: 1.4vw;
`;

