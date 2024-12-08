import { ActionButton } from 'app/components/library';
import { Recipe } from 'network/shapes/Recipe';
import styled from 'styled-components';
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

export const CraftButton = (props: Props) => {
  const { amt, actions, data, recipe, utils } = props;
  let errorText = '';
  /////////////////
  // DATA VALIDATION

  const enoughInputs = () => {
    for (let i = 0; i < recipe.inputs.length; i++) {
      const have = utils.getItemBalance(recipe.inputs[i].index);
      if (have < recipe.inputs[i].amount * amt) return false;
    }
    return true;
  };

  const enoughStamina = () => {
    return data.stamina >= recipe.cost.stamina * amt;
  };

  if (!enoughInputs()) errorText = 'Not enough items';
  else if (!enoughStamina()) errorText = 'Not enough stamina';

  return (
    <ButtonDiv>
      <ActionButton
        text={`C ${amt > 1 ? `(${amt})` : ''}`}
        onClick={() => actions.craft(recipe, 1)}
        size='medium'
        tooltip={[errorText]}
        disabled={!enoughInputs() || !enoughStamina()}
        noBorder
      />
      {/* <Stepper>
        <StepperButton onClick={handleInc} style={{ borderBottom: '0.15vw solid black' }}>
          +
        </StepperButton>
        <StepperButton onClick={handleDec}>-</StepperButton>
      </Stepper> */}
    </ButtonDiv>
  );
};
const ButtonDiv = styled.div`
  display: flex;
  flex-flow: row;
  justify-content: flex-start;
  align-items: center;
  position: absolute;
  bottom: 0.2vw;
  right: 0.2vw;

  border: solid black 0.15vw;
  border-radius: 0.4vw;

  overflow: hidden;
`;
