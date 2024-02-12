import styled from 'styled-components';

interface Props {}

export const Revealing = (props: Props) => {
  return (
    <Bound>
      <SubText>Revealing... please don't leave this page!</SubText>
    </Bound>
  );
};

const Bound = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;

  padding: 2vh 1vw;

  height: 100%;
`;

const SubText = styled.div`
  font-size: 12px;
  color: #000;
  text-align: center;
  padding: 4px 6px 0px 6px;
  font-family: Pixel;
`;
