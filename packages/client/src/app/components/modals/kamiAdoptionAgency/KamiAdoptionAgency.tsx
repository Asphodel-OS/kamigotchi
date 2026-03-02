import { EntityIndex } from 'engine/recs';
import styled from 'styled-components';

import { ModalWrapper } from 'app/components/library';
import { useLayers } from 'app/root/hooks';
import { UIComponent } from 'app/root/types';
import { getKami as _getKami } from 'network/shapes/Kami';
import { getDisplayedKamis as _getDisplayedKamis } from 'network/shapes/NewbieVendor/queries';

export const KamiAdoptionAgency: UIComponent = {
  id: 'KamiAdoptionAgencyModal',
  Render: () => {
    const layers = useLayers();

    /////////////////
    // PREPARATION

    const { network, utils } = (() => {
      const { network } = layers;
      const { world, components } = network;

      return {
        network,
        utils: {
          getDisplayedKamiEntities: (): EntityIndex[] => _getDisplayedKamis(world, components),
          getKami: (entity: EntityIndex) => _getKami(world, components, entity),
        },
      };
    })();

    /////////////////
    // INSTANTIATIONS

    const { getDisplayedKamiEntities, getKami } = utils;
    const displayedKamis = getDisplayedKamiEntities().map((entity) => getKami(entity));

    /////////////////
    // RENDER

    const HeaderRenderer = (
      <Header>
        <HeaderPart size={1.7} weight={'bolder'} spacing={-0.12}>
          Kami Adoption Agency
        </HeaderPart>
        <HeaderRow>
          <HeaderPart size={1.1}>"A partner for life!"-Jenny</HeaderPart>
          <HeaderPart size={1.1}>Forever homes for Kami!</HeaderPart>
        </HeaderRow>
      </Header>
    );

    return (
      <ModalWrapper
        id='kamiAdoptionAgency'
        canExit
        noPadding
        overlay
        positionOverride={{
          colStart: 33,
          colEnd: 67,
          rowStart: 3,
          rowEnd: 99,
          position: 'fixed',
        }}
        truncate
        header={HeaderRenderer}
      >
        <Content>
          <KamiGrid>
            {displayedKamis.map((kami) => (
              <KamiCard key={kami.entity}>
                <KamiImage src={kami.image} alt={kami.name} />
                <KamiName>{kami.name}</KamiName>
                <KamiIndex>#{kami.index}</KamiIndex>
              </KamiCard>
            ))}
          </KamiGrid>
          {displayedKamis.length === 0 && (
            <BodyText>There are no Kami available for adoption right now.</BodyText>
          )}
        </Content>
      </ModalWrapper>
    );
  },
};

const Header = styled.div`
  position: relative;
  background-color: #ffffff;
  display: flex;
  justify-content: space-around;
  align-items: center;
  gap: 0.5vw;
  padding: 1vw;
  padding-bottom: 0;
  flex-direction: column;
  line-height: 1vw;
  border: 0.3vw solid #000000;
  border-bottom: none;
  border-radius: 1vw 1vw 0 0;
`;

const HeaderRow = styled.div`
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  width: 100%;
`;

const HeaderPart = styled.div<{ size: number; weight?: string; spacing?: number }>`
  position: relative;
  color: #000000;
  padding: 0.5vw;
  letter-spacing: ${({ spacing }) => spacing || -0.08}vw;
  font-size: ${({ size }) => size}vw;
  font-weight: ${({ weight }) => weight || 'normal'};
`;

const Content = styled.div`
  position: relative;
  gap: 0.6vw;
  flex-grow: 1;
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;
  overflow: hidden auto;
  background-color: #ffffff;
  color: #000000;
  border: 0.3vw solid #000000;
  border-top: none;
  border-radius: 0 0 1vw 1vw;
  box-sizing: border-box;
  padding: 2vw;
  font-size: 1vw;
  padding-bottom: 0.5vw;
`;

const BodyText = styled.div`
  font-size: 0.85vw;
  font-weight: bold;
`;

const KamiGrid = styled.div`
  width: 100%;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1vw;
  margin-top: 1vw;
`;

const KamiCard = styled.div`
  border: 0.2vw solid #000000;
  background-color: #ffffff;
  padding: 0.8vw;
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  justify-content: center;
  gap: 0.4vw;
`;

const KamiImage = styled.img`
  width: 8vw;
  height: 8vw;
  object-fit: contain;
  border: 0.12vw solid #000000;
  background-color: #ffffff;
`;

const KamiName = styled.div`
  font-size: 0.75vw;
  font-weight: bold;
  text-align: center;
`;

const KamiIndex = styled.div`
  font-size: 0.7vw;
  color: #000000;
`;
