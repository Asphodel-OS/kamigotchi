import { useState } from 'react';
import styled from 'styled-components';

import { Card, CraftButton, Stepper } from 'app/components/library';
import { StyledTooltipText, TextTooltip } from 'app/components/library/poppers';
import { ExpIcon, StaminaIcon } from 'assets/images/icons/stats';
import { Kami } from 'network/shapes';
import { Account } from 'network/shapes/Account';
import { Allo } from 'network/shapes/Allo';
import { Item, NullItem } from 'network/shapes/Item';
import { Recipe } from 'network/shapes/Recipe';
import { DetailedEntity } from 'network/shapes/utils';
import { ItemGridTooltip } from '../../inventory/items/ItemGridTooltip';
import { Input } from './Input';

export const RecipeCard = ({
  data,
  actions,
  utils,
}: {
  data: {
    account: Account;
    recipe: Recipe;
    stamina: number;
  };
  actions: {
    craft: (amount: number) => void;
  };
  utils: {
    displayRequirementsRecipe: (recipe: Recipe) => string;
    displayRequirements: (item: Item) => string;
    getItemBalance: (index: number) => number;
    meetsRequirementsRecipe: (recipe: Recipe) => boolean;
    meetsRequirements: (holder: Kami | Account, item: Item) => boolean;
    parseAllos: (allo: Allo[]) => DetailedEntity[];
    getItemByIndex: (itemIndex: number) => Item;
  };
}) => {
  const { recipe, stamina } = data;
  const [quantity, setQuantity] = useState(1);

  const output = recipe.outputs[0];
  const inputs = recipe.inputs;
  const item = output.item ?? NullItem;
  const amt = output.amount;

  const getCosts = () => {
    const text = [
      <p key='stamina'>
        {recipe.cost.stamina} <img style={{ width: '1.2vw' }} src={StaminaIcon} />
      </p>,
    ];
    recipe.inputs.forEach((input, i) => {
      const itemName = input.item?.name ?? '???';
      text.push(
        <p key={`cost-${i}`}>
          {input.amount} {itemName}
        </p>
      );
    });

    return text;
  };

  const getRequirements = () => {
    return recipe.requirements.map((req, i) => (
      <Requirements key={`req-${req.target?.index ?? i}`}>
        <p key='value'>{Number(req.target?.value ?? 0)}</p>
        <img
          key='img'
          style={{ width: '1.2vw' }}
          src={utils.getItemByIndex(req.target?.index ?? 0).image}
          alt='Requirement'
        />
      </Requirements>
    ));
  };

  return (
    <Card
      key={recipe.index}
      image={{
        icon: item.image,
        scale: 7.5,
        padding: 1,
        overlay: `${amt * quantity}`,
        tooltip: {
          text: [<ItemGridTooltip key={item.index} item={item} utils={utils} />],
          maxWidth: 25,
        },
      }}
      fullWidth
    >
      <TitleBar>
        <Stepper value={quantity} set={setQuantity} scale={2} min={1} />
        <TitleText key='title'>{item.name}</TitleText>
        <TitleCorner key='corner'>
          <Text>{recipe.experience * quantity}</Text>
          <Icon src={ExpIcon} />
        </TitleCorner>
      </TitleBar>
      <Content>
        <TextTooltip
          text={[
            <StyledTooltipText
              img={item.image}
              title={`Recipe for ${item.name}`}
              subTitleText='Grants'
              subTitleContent={
                <>
                  {recipe.experience} <img style={{ width: '1.2vw' }} src={ExpIcon} />
                </>
              }
              description={''}
              leftSideText='Requirements'
              leftSideContent={getRequirements()}
              rightSideText='Costs'
              rightSideContent={getCosts()}
            />,
          ]}
          maxWidth={25}
        >
          <ContentRow key='column-1'>
            {inputs.map((input, i) => (
              <Input
                key={`input-${i}`}
                image={input.item?.image ?? ''}
                amt={input.amount * quantity}
                prepend={i != 0 ? '+' : '='}
              />
            ))}
            <Input image={StaminaIcon} amt={recipe.cost.stamina * quantity} prepend='+' />
          </ContentRow>
        </TextTooltip>
        <ContentColumn key='column-2'>
          <Actions>
            <CraftButton data={{ recipe, quantity, stamina }} actions={actions} utils={utils} />
          </Actions>
        </ContentColumn>
      </Content>
    </Card>
  );
};

const TitleBar = styled.div`
  border-bottom: solid black 0.15vw;

  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: space-between;
  user-select: none;
`;

const TitleText = styled.div`
  display: flex;
  justify-content: flex-start;
  padding: 0.6vw;

  font-size: 0.9vw;
  text-align: left;
`;

const TitleCorner = styled.div`
  padding: 0.45vw;
  gap: 0.15vw;

  display: flex;
  flex-grow: 1;
  align-items: center;
  justify-content: flex-end;
`;

const Text = styled.div`
  font-size: 0.9vw;
  padding-top: 0.05vw;
`;

const Icon = styled.img`
  height: 1.2vw;
`;

const Content = styled.div`
  display: flex;
  flex-grow: 1;
  flex-flow: row nowrap;
  align-items: stretch;

  padding: 0.2vw;
`;

const ContentRow = styled.div`
  display: flex;
  margin-top: 0.95vw;
`;

const ContentColumn = styled.div`
  display: flex;
  flex-flow: column nowrap;
  flex-grow: 1;
  justify-content: flex-end;

  margin: 0.2vw;
  padding-top: 0.2vw;
`;

const Actions = styled.div`
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-end;
  gap: 0.4vw;
`;

const Requirements = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.3vw;
`;
