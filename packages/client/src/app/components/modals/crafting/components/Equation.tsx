import styled from 'styled-components';

import { Tooltip } from 'app/components/library';
import { Ingredient, Recipe } from 'network/shapes/Recipe';

interface Props {
  amt: number;
  recipe: Recipe;
  utils: {
    getItemBalance: (index: number) => number;
  };
}

export const Equation = (props: Props) => {
  const { recipe, utils } = props;

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
      <ExpressionBox>
        {ingredients
          .flatMap((ingredient, i) => [EqIcon(ingredient, true), plusIcon(i)])
          .slice(0, -1)}
      </ExpressionBox>
    );
  };

  const InputDisplay = (ingredients: Ingredient[]) => {
    const plusIcon = (i: number) => <Text key={`plus-${i}`}>+</Text>;
    return (
      <ExpressionBox>
        <Text>=</Text>
        {ingredients
          .flatMap((ingredient, i) => [EqIcon(ingredient, false), plusIcon(i)])
          .slice(0, -1)}
      </ExpressionBox>
    );
  };

  return (
    <Container>
      {OutputDisplay(recipe.outputs)}
      {InputDisplay(recipe.inputs)}
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-flow: row;
  justify-content: flex-start;
  align-items: flex-end;

  gap: 0.2vw;
`;

const VariableBox = styled.div<{ disabled: boolean }>`
  display: flex;
  flex-flow: row;
  justify-content: center;
  align-items: flex-end;

  padding: 0.2vw;

  ${({ disabled }) => disabled && 'opacity: 0.6;'}
`;

const ExpressionBox = styled.div`
  display: flex;
  flex-flow: row;
  justify-content: flex-start;
  align-items: center;

  gap: 0.2vw;
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
