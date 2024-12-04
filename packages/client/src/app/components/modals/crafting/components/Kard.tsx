import styled from 'styled-components';

import { CraftButton } from 'app/components/library/actions/CraftButton';
import { Recipe } from 'network/shapes/Recipe';
import { useState } from 'react';
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
      <Equation
        amt={amt}
        recipe={recipe}
        data={data}
        actions={actions}
        utils={{ ...utils, setAmt }}
      />
      <CraftButton
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
  height: max-content;
  width: 100%;

  border: solid black 0.2vw;
  border-radius: 0.4vw;

  background-color: #fff;
`;
