import styled from 'styled-components';

import { TokenIcons } from 'assets/images/tokens';
import { Kami } from 'network/shapes/Kami';
import { KamiOption, SelectYourKami } from './SelectYourKami';

const expirationOptions = [
  { value: 1, label: '1 Hour' },
  { value: 3, label: '3 Hours' },
  { value: 24, label: '24 Hours' },
  { value: 0, label: 'Never' },
];

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
  hasExternalKamis,
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
  hasExternalKamis: boolean;
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
            hasExternalKamis={hasExternalKamis}
          />
          <Section>
            <SubHeader>Price</SubHeader>
            <Price>
              <PriceInput
                type='text'
                inputMode='decimal'
                placeholder='0'
                value={price}
                onChange={(e) => {
                  const val = e.target.value;
                  // TODO: remove \.? if we dont want decimals
                  if (val === '' || /^\d*\.?\d*$/.test(val)) setPrice(val);
                }}
              />
              <EthIcon src={TokenIcons.eth} alt='ETH' />
            </Price>
          </Section>
        </Row>
      </Body>
      <SubHeader>Expiration</SubHeader>
      <Body>
        <ExpirationRow>
          {expirationOptions.map((opt) => (
            <RadioLabel key={opt.value}>
              <input
                type='radio'
                name='expiration'
                value={opt.value}
                checked={expiration === opt.value}
                onChange={() => setExpiration(opt.value)}
              />
              {opt.label}
            </RadioLabel>
          ))}
        </ExpirationRow>
      </Body>
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
  gap: 0.6vw;
`;

const SubHeader = styled.div`
  border-bottom: 0.15vw solid black;
  padding: 0.8vw;
  font-size: 1vw;
  text-align: left;
`;

const Body = styled.div`
  padding: 0.3vw 0 0 0.3vw;
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

const ExpirationRow = styled.div`
  margin-top: 0.3vw;
  display: flex;
  flex-flow: row nowrap;
  gap: 1.2vw;
  align-items: center;
`;

const RadioLabel = styled.label`
  font-size: 1vw;
  display: flex;
  align-items: center;
  gap: 0.2vw;
  cursor: pointer;

  input[type='radio'] {
    accent-color: rgb(203, 186, 61);
    cursor: pointer;
  }
`;
