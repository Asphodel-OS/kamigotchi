import styled from 'styled-components';

type NodeInfoProps = {
  node: Node;
};

type Node = {
  name: string;
  uri: string;
  text1: string;
  text2: string;
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
  return (
    <NodeInfoContainer>
      <img
        src={
          node.uri ??
          'https://t3.ftcdn.net/jpg/00/99/48/12/360_F_99481297_bbpqwxB7T0xL5DZHpwzrkWVd0vlT2GrT.jpg'
        }
        alt={node.name}
      />
      <div className="text-container">
        <p>{node.name}</p>
        <div className="text1">{node.text1 ?? '(Eerie) Remote Hillside'}</div>
        <div className="text2">
          {node.text2 ??
            'This is a node. You can harvest from it by using your Kamigotchi! This is the only way to get $KAMI, the only hope you have to find self worth.'}
        </div>
      </div>
    </NodeInfoContainer>
  );
};
