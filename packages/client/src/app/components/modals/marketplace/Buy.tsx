import styled from 'styled-components';

import { IconListButton, IconListButtonOption } from 'app/components/library';
import { MenuIcons } from 'assets/images/icons/menu';
import { TokenIcons } from 'assets/images/tokens';
import { Kami } from 'network/shapes/Kami';

const expirationOptions = [
  { value: 1, label: '1 Hour' },
  { value: 3, label: '3 Hours' },
  { value: 24, label: '24 Hours' },
  { value: 0, label: 'Never' },
];

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
}) => (
  <Conditional isVisible={isVisible}>
    <Body>
      <Row>
        <Section>
          <SubHeader>Kami</SubHeader>
          <KamiPickerRow>
            <Price>
              <PriceInput
                type='text'
                inputMode='numeric'
                placeholder='0'
                value={quantity}
                disabled={!!selectedBuyKami}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || /^\d+$/.test(val)) setQuantity(val);
                }}
              />
              <KamiIcon src={MenuIcons.kami} alt='Kami' />
            </Price>
            <Divider>or</Divider>
            <IconListButton
              img={MenuIcons.kami}
              options={kamiOptions}
              searchable
              disabled={!!quantity}
            />
          </KamiPickerRow>
          {selectedBuyKami && <KamiImage src={selectedBuyKami.image} alt={selectedBuyKami.name} />}
        </Section>
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
              name='buy-expiration'
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

const Conditional = styled.div<{ isVisible: boolean }>`
  ${({ isVisible }) => (isVisible ? `` : `display: none;`)}
`;

const Section = styled.div`
  display: flex;
  flex-flow: column nowrap;
  width: 100%;
  gap: 0.6vw;
`;

const SubHeader = styled.div`
  border-bottom: 0.15vw solid black;
  padding: 0.8vw;
  font-size: 1.1vw;
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

  &:disabled {
    background: #e9e9e9;
    color: #666;
    cursor: not-allowed;
  }
`;

const EthIcon = styled.img`
  width: 1.4vw;
  height: 1.4vw;
`;

const KamiIcon = styled.img`
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

const Divider = styled.div`
  font-size: 0.9vw;
  text-align: center;
  color: #888;
  margin: 0 0.2vw;
`;

const KamiPickerRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6vw;
`;

const KamiImage = styled.img`
  height: 6vw;
  width: 6vw;
  border: solid 0.15vw black;
  border-radius: 0.6vw;
  image-rendering: pixelated;
`;
