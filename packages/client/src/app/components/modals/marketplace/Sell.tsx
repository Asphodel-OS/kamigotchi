import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { TextTooltip } from 'app/components/library';
import { DropdownToggle } from 'app/components/library/buttons/DropdownToggle';
import { MenuIcons } from 'assets/images/icons/menu';
import { TokenIcons } from 'assets/images/tokens';
import { Kami, NullKami } from 'network/shapes/Kami';

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
  kamiOptions: { text: string; object: any; img: string }[];
  handleKamiSelect: (selected: any[]) => void;
  selectedKami: Kami[];
  onKamiClick: () => void;
  price: string;
  setPrice: (val: string) => void;
  expiration: number;
  setExpiration: (val: number) => void;
  hasExternalKamis: boolean;
}) => {
  const [clearTrigger, setClearTrigger] = useState(false);

  useEffect(() => {
    if (selectedKami[0]?.id === NullKami.id) {
      setClearTrigger((prev) => !prev);
    }
  }, [selectedKami]);
  return (
    <Conditional isVisible={isVisible}>
      <Body>
        <Row>
          <Section>
            <SubHeader>Kami</SubHeader>
            <TextTooltip
              text={hasExternalKamis ? [] : [`You don't have out of world Kami`]}
              alignText='center'
            >
              <DropdownToggle
                limit={1}
                options={[kamiOptions]}
                onClick={[handleKamiSelect]}
                disabled={[!hasExternalKamis]}
                button={{
                  images: [MenuIcons.kami],
                  tooltips: ['Select Kami'],
                }}
                radius={0.6}
                simplified
                clearTrigger={clearTrigger}
              />
            </TextTooltip>
            {selectedKami[0].id !== NullKami.id && (
              <KamiImage
                src={selectedKami[0].image}
                alt={selectedKami[0].name}
                onClick={onKamiClick}
              />
            )}
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

const KamiImage = styled.img`
  height: 6vw;
  width: 6vw;
  border: solid 0.15vw black;
  border-radius: 0.6vw;
  image-rendering: pixelated;
  cursor: pointer;
  &:hover {
    opacity: 0.75;
  }
`;
