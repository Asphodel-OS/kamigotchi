import styled from 'styled-components';

import { ActionButton, Tooltip } from 'app/components/library';
import { powerIcon, staminaIcon } from 'assets/images/icons/stats';
import { Recipe } from 'network/shapes/Recipe';
import { playClick } from 'utils/sounds';

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

export const ActionRow = (props: Props) => {
  const { amt, actions, data, recipe, utils } = props;

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

  /////////////////
  // INTERACTIONS

  const handleInc = () => {
    playClick();
    utils.setAmt(amt + 1);
  };

  const handleDec = () => {
    playClick();
    if (amt <= 1) return;
    utils.setAmt(amt - 1);
  };

  /////////////////
  // DISPLAY

  const CraftButton = () => {
    let errorText = '';
    if (!enoughInputs()) errorText = 'Not enough items';
    else if (!enoughStamina()) errorText = 'Not enough stamina';

    return (
      <ButtonDiv>
        <ActionButton
          text={`Craft ${amt > 1 ? `(${amt})` : ''}`}
          onClick={() => actions.craft(recipe, 1)}
          size='medium'
          tooltip={[errorText]}
          disabled={!enoughInputs() || !enoughStamina()}
          noBorder
          noMargin
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

  return (
    <Container>
      <Tooltip text={[`Grants ${recipe.experience} xp`]}>
        <DescriptionRow>
          <Icon src={powerIcon} />
          <SubText>{recipe.experience * amt}</SubText>
        </DescriptionRow>
      </Tooltip>
      <Tooltip text={[`Uses ${recipe.cost.stamina * -1} stamina`]}>
        <DescriptionRow>
          <Icon src={staminaIcon} />
          <SubText>{recipe.cost.stamina * amt}</SubText>
        </DescriptionRow>
      </Tooltip>
      {CraftButton()}
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-flow: row;
  justify-content: flex-end;
  align-items: center;

  gap: 0.6vw;
  width: 100%;
  padding-top: 1.2vw;
`;

const Icon = styled.img`
  width: 1.4vw;
  image-rendering: pixelated;
`;

const SubText = styled.div`
  font-size: 0.8vw;
  line-height: 1.2vw;

  color: #333;
`;

const DescriptionRow = styled.div`
  display: flex;
  flex-flow: row;
  justify-content: flex-start;
  align-items: center;

  gap: 0.2vw;
`;

const ButtonDiv = styled.div`
  display: flex;
  flex-flow: row;
  justify-content: flex-start;
  align-items: center;

  border: solid black 0.15vw;
  border-radius: 0.4vw;

  overflow: hidden;
`;

const Stepper = styled.div`
  display: flex;
  flex-flow: column;
  align-items: center;

  border-radius: 0.4vw;
`;

const StepperButton = styled.div`
  background-color: #fff;
  border-left: 0.15vw solid black;
  width: 100%;

  cursor: pointer;
  pointer-events: auto;
  user-select: none;

  color: black;
  font-family: Pixel;
  font-size: 0.8vw;
  padding: 0.1vh 0.36vw;
  text-align: center;

  &:hover {
    background-color: #ddd;
  }
  &:active {
    background-color: #bbb;
  }
`;
