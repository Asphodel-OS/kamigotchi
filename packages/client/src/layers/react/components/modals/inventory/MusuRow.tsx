import styled from "styled-components";


interface Props {
  balance: number;
};

// get the row of consumable items to display in the player inventory
export const MusuRow = (props: Props) => {
  return (
    <Container key='musu'>
      <Balance>${props.balance}</Balance>
    </Container>
  );
};


const Container = styled.div`
  padding: .5vw;  

  display: flex;
  flex-flow: column no-wrap;
  justify-content: flex-end;
  width: 100%;
`;

const Balance = styled.div`
  border: solid black .15vw;
  border-radius: .3vw;
  padding: .5vw;
  width: 50%;

  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-end;  

  color: black;
  font-family: Pixel;
  font-size: 1vw;
`;
