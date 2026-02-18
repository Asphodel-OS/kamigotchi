import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { TextTooltip } from 'app/components/library';
import { DropdownToggle } from 'app/components/library/buttons/DropdownToggle';
import { MenuIcons } from 'assets/images/icons/menu';
import { Kami, NullKami } from 'network/shapes/Kami';

export interface KamiOption {
  text: string;
  object: Kami;
  img: string;
}

export const SelectYourKami = ({
  kamiOptions,
  handleKamiSelect,
  selectedKami,
  onKamiClick,
  hasExternalKamis,
  unavailableTooltip,
}: {
  kamiOptions: KamiOption[];
  handleKamiSelect: (selected: Kami[]) => void;
  selectedKami: Kami[];
  onKamiClick: () => void;
  hasExternalKamis: boolean;
  unavailableTooltip: string;
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
        text={hasExternalKamis ? [] : [unavailableTooltip]}
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
  white-space: nowrap;
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
