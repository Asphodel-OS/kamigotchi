import { interval, map } from 'rxjs';
import styled from 'styled-components';

import { getAccount } from 'app/cache/account';
import { ModalWrapper } from 'app/components/library';
import { Popover } from 'app/components/library/base/Popover';
import { registerUIComponent } from 'app/root';
import { ActionIcons } from 'assets/images/icons/actions';
import { queryAccountFromEmbedded } from 'network/shapes/Account';

export function registerTradingModal() {
  registerUIComponent(
    'TradingModal',

    // Grid Config
    {
      colStart: 25,
      colEnd: 75,
      rowStart: 25,
      rowEnd: 65,
    },

    // Requirement
    (layers) =>
      interval(1000).pipe(
        map(() => {
          const { network } = layers;
          const { world, components } = network;

          const accountEntity = queryAccountFromEmbedded(network);
          const accountID = world.entities[accountEntity];
          const account = getAccount(world, components, accountEntity, { live: 2, config: 3600 });

          return {
            network,
            accountEntity,
            data: {},
            utils: {},
          };
        })
      ),

    // Render
    ({ data, network, utils }) => {
      const { actions, api, components, world } = network;
      const options = [
        {
          text: 'Default',
          // onClick: () =>
        },
        {
          text: 'Price',
          // onClick: () =>
        },

        {
          text: 'Type',
          // onClick: () =>
        },

        {
          text: 'Item',
          //onClick: () =>
        },
      ];
      const OptionsMap = () => {
        return options.map((option, i) => (
          <PopOverButton
            style={{ padding: `0.4vw`, fontSize: `1vw`, width: `23.9vw` }}
            key={`div-${i}`}
          >
            {option.text}
          </PopOverButton>
        ));
      };
      /////////////////
      // ACTIONS

      /////////////////
      // DISPLAY

      return (
        <ModalWrapper
          id='trading'
          header={<Header style={{}}>Trade</Header>}
          canExit
          width='min-content'
        >
          <Content>
            <Row>
              <Label>
                SEARCH
                <Search />
              </Label>
              <Label>
                SORT BY
                <Popover content={OptionsMap()}>
                  <Sort>Default</Sort>
                </Popover>
              </Label>
            </Row>
            <Row>
              <Label>
                Active Offers
                <Search />
              </Label>
              <Search />
            </Row>
          </Content>
        </ModalWrapper>
      );
    }
  );
}

const Content = styled.div`
  display: flex;
  flex-flow: wrap;
  -webkit-box-pack: start;
  justify-content: flex-start;
  gap: 0.6vw;
  padding: 0.5vw;
  width: 50vw;
  height: 50vh;
  flex-wrap: nowrap;
  flex-direction: column;
`;
const Header = styled.div`
  padding: 2vw;
`;
const Row = styled.div`
  display: flex;
  width: 100%;
  justify-content: space-between;
`;
const Label = styled.label`
  display: flex;
  flex-direction: column;
  font-size: 1vw;
  width: 49%;
`;
const Search = styled.input`
  border-radius: 0.6vw;
  border: 0.15vw solid black;

  margin: 4% 0 0 0;
  min-height: 3vw;
  background: url(${ActionIcons.search}) no-repeat left center;
  background-origin: content-box;
  padding: 0.5vw 1vw;
  background-size: contain;
`;
const Sort = styled.button`
  display: flex;
  border-radius: 0.6vw;
  border: 0.15vw solid black;

  margin: 4% 0 0 0;
  min-height: 3vw;
  width: 100%;
  font-size: 1vw;
  align-items: center;
  padding-left: 1vw;
`;
const PopOverButton = styled.button`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;
