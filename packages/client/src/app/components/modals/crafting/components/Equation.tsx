import styled from 'styled-components';

import { Tooltip } from 'app/components/library';
import { Ingredient, Recipe } from 'network/shapes/Recipe';
import { ActionRow } from './ActionRow';

interface Props {
  amt: number;
  recipe: Recipe;
  data: {
    stamina: number;
  };
  actions: {
    craft: (recipe: Recipe, amount: number) => void;
  };
  utils: {
    getItemBalance: (index: number) => number;
    setAmt: (amt: number) => void;
  };
}

export const Equation = (props: Props) => {
  const { amt, actions, data, recipe, utils } = props;

  const EqIcon = (ingredient: Ingredient, output: boolean) => {
    const enoughBalance =
      output || utils.getItemBalance(ingredient.index) >= ingredient.amount * props.amt;
    return (
      <Tooltip
        text={[`${ingredient.amount}x ${ingredient.item.name} per craft`]}
        key={`eq-${ingredient.item.name}-${output}`}
      >
        <VariableBox key={`eq-${ingredient.item.name}-${output}`} disabled={!enoughBalance}>
          <Image src={ingredient.item.image} output={output} />
          <QuantityText output={output}>{ingredient.amount * props.amt}</QuantityText>
        </VariableBox>
      </Tooltip>
    );
  };

  const OutputDisplay = (ingredients: Ingredient[]) => {
    const plusIcon = (i: number) => <Text key={`plus-${i}`}>+</Text>;
    return (
      <ExpressionBoxOutput>
        {ingredients
          .flatMap((ingredient, i) => [EqIcon(ingredient, true), plusIcon(i)])
          .slice(0, -1)}
      </ExpressionBoxOutput>
    );
  };

  const InputDisplay = (ingredients: Ingredient[]) => {
    const plusIcon = (i: number) => <Text key={`plus-${i}`}>+</Text>;
    return (
      <ExpressionBoxInput>
        <Text>=</Text>
        {ingredients
          .flatMap((ingredient, i) => [EqIcon(ingredient, false), plusIcon(i)])
          .slice(0, -1)}
      </ExpressionBoxInput>
    );
  };

  return (
    <Container>
      {OutputDisplay(recipe.outputs)}
      <div style={{ width: '100%' }}>
        <ActionRow amt={amt} recipe={recipe} data={data} actions={actions} utils={{ ...utils }} />
        {InputDisplay(recipe.inputs)}
      </div>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-flow: row;
  -webkit-box-align: center;
  align-items: flex-start;
  height: 100%;
  width: 100%;
`;
/*
  display: flex;
  flex-flow: row;
  align-items: center;
  align-items: center;
  height: 100%;
  width: 100%;

*/
const VariableBox = styled.div<{ disabled: boolean }>`
  display: flex;
  flex-flow: row;
  justify-content: center;
  align-items: flex-end;

  ${({ disabled }) => disabled && 'opacity: 0.6;'}
`;

const ExpressionBoxOutput = styled.div`
  display: flex;
  flex-flow: row;
  -webkit-box-pack: start;
  justify-content: center;
  -webkit-box-align: center;
  border-style: solid;
  border-color: black;
  border-image: initial;
  border-width: 0px 0.2vw 0px 0px;
  padding: 0.5vw 0.5vw 1vw 1vw;
  min-height: 6.5vw;
  flex-wrap: wrap;
  flex-direction: column;
  align-content: center;
  align-items: center;
`;
/*
    display: flex;
    flex-flow: row;
    -webkit-box-pack: start;
    justify-content: center;
    -webkit-box-align: center;
    border-style: solid;
    border-color: black;
    border-image: initial;
    border-width: 0px 0.2vw 0px 0px;
    padding: 0.5vw 0.5vw 1vw 1vw;
    min-height: 6.5vw;
    flex-wrap: wrap;
    flex-direction: column;
    align-content: center;
    align-items: center;


*/

/*
  display: flex;
  flex-flow: row;
  justify-content: flex-start;
  align-items: center;
  border: solid black 0.2vw;
  border-width: 0 0.2vw 0 0;
  padding: 0.5vw 1vw 0 1vw;
  height: 6.5vw;
*/
const ExpressionBoxInput = styled.div`
  display: flex;
  flex-flow: row;
  justify-content: flex-start;
  align-items: center;
  border: solid black 0.2vw;
  border-width: 0.2vw 0 0 0;
  padding: 0.3vw 5vw 1.5vw 0.3vw;
  width: 100%;
`;

const Text = styled.div`
  font-size: 1.2vw;
  color: #333;
`;

const Image = styled.img<{ output?: boolean }>`
  width: ${({ output }) => (output ? '2.8vw' : '2.2vw')};
  image-rendering: pixelated;
`;

const QuantityText = styled.div<{ output?: boolean }>`
  color: #333;

  font-size: 0.8vw;
  margin-bottom: -0.6vw;
  margin-right: -0.24vw;

  ${({ output }) =>
    output &&
    `
    font-size: 1.2vw;
    margin-bottom: -0.8vw;
  `}
`;
