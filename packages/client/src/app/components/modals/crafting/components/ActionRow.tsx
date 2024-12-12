import styled from 'styled-components';

import { Tooltip } from 'app/components/library';
import { StatIcons } from 'assets/images/icons/stats';
import { Ingredient, Recipe } from 'network/shapes/Recipe';
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
  const { amt, recipe, utils } = props;

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

  const RecipeName = (recipe: Recipe) => {
    const itemNames = recipe.outputs.map((output: Ingredient) => output.item.name);
    return itemNames.join(' + ');
  };

  return (
    <Container>
      <div style={{ fontSize: '1vw' }}>{RecipeName(recipe)}</div>
      <Icons>
        <Tooltip text={[`Grants ${recipe.experience} xp`]}>
          <DescriptionRow>
            <Icon src={StatIcons.xp} />
            <SubText>{recipe.experience * amt}</SubText>
          </DescriptionRow>
        </Tooltip>
        <Tooltip text={[`Uses ${recipe.cost.stamina * -1} stamina`]}>
          <DescriptionRow>
            <Icon src={StatIcons.stamina} />
            <SubText>{recipe.cost.stamina * amt}</SubText>
          </DescriptionRow>
        </Tooltip>
      </Icons>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-direction: row;
  padding: 0.2vw;
  width: 100%;
`;

const Icons = styled.div`
  display: flex;
  flex-flow: row;
  justify-content: flex-end;
  align-items: center;
  flex-direction: row;
  padding: 0 0.5vw 0.2vw 0;
  gap: 0.6vw;
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
