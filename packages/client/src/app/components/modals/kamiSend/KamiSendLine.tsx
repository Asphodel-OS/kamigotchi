import styled from 'styled-components';

import { IconListButton, IconListButtonOption } from 'app/components/library';
import { ActionIcons } from 'assets/images/icons/actions';
import placeholderKami from 'assets/images/kamis/placeholderKami.gif';
import { Kami } from 'network/shapes/Kami';
import { playClick } from 'utils/sounds';

export const KamiSendLine = ({
  options,
  selected,
  onRemove,
}: {
  options: IconListButtonOption[];
  selected: Kami | null;
  onRemove: () => void;
}) => {
  if (selected) {
    return (
      <FilledTile
        onClick={() => {
          onRemove();
          playClick();
        }}
      >
        <KamiImage src={selected.image} alt={selected.name} />
        <RemoveOverlay>
          <RemoveIcon src={ActionIcons.cancel} alt='Remove' />
        </RemoveOverlay>
      </FilledTile>
    );
  }

  return (
    <EmptyTile>
      <IconListButton
        options={options}
        searchable
        img={placeholderKami}
        scale={5.25}
        tooltip={{ text: ['Select kami'] }}
      />
    </EmptyTile>
  );
};

const FilledTile = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  border-radius: 0.4vw;
  border: 0.15vw solid black;
  background: #fff;
  overflow: hidden;
  cursor: pointer;

  &:hover {
    border-color: #333;
  }
`;

const KamiImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  image-rendering: pixelated;
`;

const RemoveOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(180, 30, 30, 0.45);
  opacity: 0;
  transition: opacity 0.15s;

  ${FilledTile}:hover & {
    opacity: 1;
  }
`;

const RemoveIcon = styled.img`
  width: 2.5vw;
  height: 2.5vw;
  image-rendering: pixelated;
  pointer-events: none;
  filter: drop-shadow(0 0 0.2vw rgba(0, 0, 0, 0.5));
`;

const EmptyTile = styled.div`
  width: 100%;
  aspect-ratio: 1;
  border-radius: 0.4vw;
  border: 0.15vw dashed #bbb;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;

  &:hover {
    border-color: #888;
    background: #e8e8e8;
  }
`;
