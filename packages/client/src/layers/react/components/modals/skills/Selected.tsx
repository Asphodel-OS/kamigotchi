import { Kami } from "layers/react/shapes/Kami";
import styled from "styled-components";

interface Props {
  kami: Kami;
}

// make this compatible with both kamis and accounts
// only need to show basic info: name, skill points, maybe image
export const Selected = (props: Props) => {
  return (
    <Container>
      <Image src={props.kami.uri} />
      <Content>
        <ContentTop>
          <TitleRow>
            <Title>{props.kami.name}</Title>
          </TitleRow>
        </ContentTop>
      </Content>
    </Container>
  );
}

const Container = styled.div`
  color: black;

  display: flex;
  flex-flow: row nowrap;
`;

const Image = styled.img`
  border-radius: 8px 0px 0px 0px;
  border-right: solid black .15vw;
  height: 14vw;
`;

const Content = styled.div`
  flex-grow: 1;
  padding: .7vw;

  display: flex;
  flex-flow: column nowrap;
  justify-content: space-between;
  position: relative;
`;

const ContentTop = styled.div`
  display: flex;
  flex-flow: column nowrap;
`;

const TitleRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: flex-end;
  margin: 1.5vw .3vw .7vw .3vw;
`;

const Title = styled.div`
  background-color: #ffffff;
  color: black;
  font-family: Pixel;
  font-size: 2vw;
`;

const Subtext = styled.div`
  padding: 0 0 .1vw .6vw;
  
  color: #666;
  font-family: Pixel;
  font-size: .9vw;
`;

const ContentMiddle = styled.div`
  flex-grow: 1;
  width: 80%;
  display: flex;
  flex-direction: row wrap;
  align-items: center;
  justify-content: flex-start;
`;

const InfoBox = styled.div`
  border: solid black .12vw;
  border-radius: 5px;
  margin: .3vw;
  padding: .3vw;
  
  display: flex;
  flex-direction: column;
  &:hover {
    background-color: #ddd;
  }
`

const InfoLabel = styled.div`
  margin: .3vw;
  align-self: flex-start;
  
  color: black;
  font-family: Pixel;
  font-size: .9vw;
`;

const InfoContent = styled.div`
  color: black;
  padding: 5px;
  align-self: center;

  font-family: Pixel;
  font-size: 1.2vw;
  font-weight: 600;
  margin: auto;
`;

const Footer = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: .7vw;
  
  font-family: Pixel;
  font-size: .6vw;
  text-align: right;
  color: #666;
`;
