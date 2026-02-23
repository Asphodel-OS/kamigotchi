import styled from 'styled-components';

import { TokenIcons } from 'assets/images/tokens';
import { Kami } from 'network/shapes/Kami';
import { ExpirySlider } from './ExpirySlider';
import { KamiOption, SelectYourKami } from './SelectYourKami';

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
  return (
    <Conditional isVisible={isVisible}>
      <Body>
        <Row>
          <SelectYourKami
            kamiOptions={kamiOptions}
            handleKamiSelect={handleKamiSelect}
            selectedKami={selectedKami}
            onKamiClick={onKamiClick}
            hasSellableKamis={hasSellableKamis}
            disabledTooltip={disabledTooltip}
          />
          <Section>
            <SectionLabel>Price</SectionLabel>
            <Price>
              <PriceInput
                type='text'
                inputMode='decimal'
                placeholder='0'
                value={price}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || /^\d*\.?\d{0,18}$/.test(val)) setPrice(val);
                }}
              />
              <EthIcon src={TokenIcons.eth} alt='ETH' />
            </Price>
          </Section>
        </Row>
      </Body>
      <ExpirySection>
        <SectionLabel>Expiration</SectionLabel>
        <ExpirySlider expirationHours={expiration} setExpirationHours={setExpiration} />
      </ExpirySection>
    </Conditional>
  );
};

const Conditional = styled.div<{ isVisible: boolean }>`
  ${({ isVisible }) => (isVisible ? `` : `display: none;`)}
`;

const Section = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-flow: column nowrap;
  gap: 0.4vw;
`;

const SectionLabel = styled.div`
  font-weight: bold;
  font-size: 0.8vw;
  padding-bottom: 0.2vw;
  border-bottom: 0.08vw solid #ddd;
`;

const Body = styled.div`
  padding: 0.6vw;
  gap: 0.6vw;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const Price = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4vw;
`;

const Row = styled.div`
  width: 100%;
  gap: 0.6vw;
  display: flex;
  flex-flow: row nowrap;
  align-items: flex-start;
`;

const PriceInput = styled.input`
  font-size: 1vw;
  width: 6vw;
  height: 2.5vw;
  padding: 0.3vw 0.4vw;
  border: 0.15vw solid black;
  border-radius: 0.6vw;
  outline: none;
  background: white;
`;

const EthIcon = styled.img`
  width: 1.4vw;
  height: 1.4vw;
`;

const ExpirySection = styled.div`
  padding: 0 0.6vw 0.3vw;
  display: flex;
  flex-direction: column;
  gap: 0.4vw;
`;
