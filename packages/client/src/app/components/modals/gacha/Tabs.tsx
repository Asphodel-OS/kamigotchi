import styled from 'styled-components';

import { ActionButton, Tooltip } from 'app/components/library';

import { helpIcon } from 'assets/images/icons/menu';
import { playClick } from 'utils/sounds';

interface Props {
  tab: string;
  setTab: (tab: string) => void;
  commits: number;
  gachaBalance: number;
}

export const Tabs = (props: Props) => {
  // layer on a sound effect
  const setTab = async (tab: string) => {
    playClick();
    props.setTab(tab);
  };

  let text: string[] = [];
  if (props.tab === 'MINT')
    text = ['A kami gacha pool!', '', 'Each ticket gets you a random kami from the pool.'];
  else if (props.tab === 'REROLL')
    text = [
      'Re-roll your kamigochi to get a new one from the pool!',
      'The old kamigochi will go back into the pool.',
      '',
      'Re-rolling price per kamigochi increases with each re-roll.',
    ];
  else if (props.tab === 'COMMITS')
    text = [
      'Kamigochi uses a commit-reveal scheme to ensure fair randomness.',
      '',
      'This requires two transactions, which should execute automatically.',
      'Please contact us on discord if any commits have expired.',
    ];

  return (
    <Container>
      <Row>
        <ActionButton
          onClick={() => setTab('MINT')}
          text='Mint'
          disabled={props.tab === 'MINT'}
          size='medium'
        />
        <ActionButton
          onClick={() => setTab('REROLL')}
          text='Re-roll'
          disabled={props.tab === 'REROLL'}
          size='medium'
        />
        {props.commits > 0 && (
          <ActionButton
            onClick={() => setTab('COMMITS')}
            text='Pending'
            disabled={props.tab === 'COMMITS'}
            size='medium'
          />
        )}
      </Row>
      <Row>
        <BalanceText>{props.gachaBalance} kamis in pool</BalanceText>
        <Tooltip text={text}>
          <Help src={helpIcon} />
        </Tooltip>
      </Row>
    </Container>
  );
};

const Container = styled.div`
  background-color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;

  padding: 1vh 1.6vw 0.2vh;
`;

const Help = styled.img`
  height: 2.4vh;
  margin: 0.1vh 0.5vw;
`;

const BalanceText = styled.div`
  font-family: Pixel;
  font-size: 1.2vw;
  color: #333;
`;

const Row = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;
