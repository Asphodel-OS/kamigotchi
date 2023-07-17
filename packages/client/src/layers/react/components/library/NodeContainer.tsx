import styled from 'styled-components';
import React, { useCallback } from 'react';

import { Node } from 'layers/react/shapes/Node';
import { dataStore } from 'layers/react/store/createStore';

type NodeInfoProps = {
  node: Node;
};

const NodeInfoContainer = styled.div`
  display: flex;
  align-items: center;
  color: black;
  border: 1px solid #ccc;
  border-radius: 4px;

  img {
    width: 150px;
    height: 150px;
    object-fit: cover;
    margin-right: 20px;
  }

  .text-container {
    display: flex;
    flex-direction: column;

    p {
      margin: 0;
      font-size: 28px;
      font-weight: bold;
    }

    .text1 {
      font-size: 18px;
      margin-top: 10px;
    }

    .text2 {
      font-size: 16px;
      margin-top: 5px;
    }
  }
`;

export const NodeInfo: React.FC<NodeInfoProps> = ({ node }) => {

  const { visibleModals, setVisibleModals } = dataStore();

  const hideModal = useCallback(() => {
    setVisibleModals({ ...visibleModals, node: false });
  }, [setVisibleModals, visibleModals]);

  return (
    <NodeInfoContainer>
      <div className="text-container">
        <div>
          <AlignRight>
            <TopButton style={{ pointerEvents: 'auto' }} onClick={hideModal}>
              X
            </TopButton>
          </AlignRight>
          <Header>{node.name}</Header>
        </div>
        <BoldKamiText className="text1">{node.affinity}</BoldKamiText>
        <KamiText className="text2">
          {node.description}
        </KamiText>
      </div>
    </NodeInfoContainer>
  );
};

const KamiText = styled.p`
  background-color: #ffffff;
  color: black;
  font-size: 14px;
  font-family: Pixel;
  grid-row: 1;
  padding-bottom: 10px;
`;

const BoldKamiText = styled.p`
  background-color: #ffffff;
  color: black;
  font-size: 14px;
  font-family: Pixel;
  grid-row: 1;
  font-weight: 600;
`;

const Header = styled.p`
  background-color: #ffffff;
  color: black;
  font-size: 20px;
  font-family: Pixel;
  grid-row: 1;
  font-weight: 600;
  padding-top: 10px;
`;

const TopButton = styled.button`
  background-color: #ffffff;
  border-style: solid;
  border-width: 2px;
  border-color: black;
  color: black;
  padding: 5px;
  font-size: 14px;
  cursor: pointer;
  pointer-events: auto;
  border-radius: 5px;
  font-family: Pixel;
  width: 30px;
  &:active {
    background-color: #c4c4c4;
  }
  margin: 0px;
`;

const AlignRight = styled.div`
  text-align: left;
  margin: 0px;
`;
