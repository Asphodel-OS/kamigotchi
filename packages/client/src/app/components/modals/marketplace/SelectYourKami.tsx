import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { TextTooltip } from 'app/components/library';
import { DropdownToggle } from 'app/components/library/buttons/DropdownToggle';
import { MenuIcons } from 'assets/images/icons/menu';
import { Kami, NullKami } from 'network/shapes/Kami';

export const SelectYourKami = ({
  kamiOptions,
  handleKamiSelect,
  selectedKami,
  onKamiClick,
  hasExternalKamis,
}: {
  kamiOptions: { text: string; object: any; img: string }[];
  handleKamiSelect: (selected: any[]) => void;
  selectedKami: Kami[];
  onKamiClick: () => void;
  hasExternalKamis: boolean;
}) => {
  const [clearTrigger, setClearTrigger] = useState(false);

  useEffect(() => {
    if (selectedKami[0]?.id === NullKami.id) {
      setClearTrigger((prev) => !prev);
    }
  }, [selectedKami]);

  return (
    <Section>
      <SubHeader>Select your kami</SubHeader>
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
        <KamiImage src={selectedKami[0].image} alt={selectedKami[0].name} onClick={onKamiClick} />
      )}
    </Section>
  );
};

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
