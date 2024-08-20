import styled from 'styled-components';

import { Recipe } from 'network/shapes/Recipe';
import { useState } from 'react';
import { ActionRow } from './ActionRow';
import { Equation } from './Equation';

interface Props {
  recipe: Recipe;
  data: {
    stamina: number;
  };
  actions: {
    craft: (recipe: Recipe, amount: number) => void;
  };
  utils: {
    getItemBalance: (index: number) => number;
  };
}

export const Kard = (props: Props) => {
  const { actions, data, recipe, utils } = props;

  const [amt, setAmt] = useState(1);

  return (
    <Container>
      <Equation amt={amt} recipe={recipe} utils={utils} />
      <ActionRow
        amt={amt}
        recipe={recipe}
        data={data}
        actions={actions}
        utils={{ ...utils, setAmt }}
      />
    </Container>
  );
};

const Container = styled.div`
  position: relative;

  display: flex;
  flex-flow: column;
  justify-content: flex-start;
  align-items: flex-start;

  border: solid black 0.2vw;
  border-radius: 1.2vw;
  padding: 0.8vw;
  margin: 0.8vh 0.8vw;
  background-color: #fff;
`;
