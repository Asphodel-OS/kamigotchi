import styled from 'styled-components';

import { ActionButton, Tooltip } from 'layers/react/components/library';

import { helpIcon } from 'assets/images/icons/menu';
import { playClick } from 'utils/sounds';

interface Props {
  tab: string;
  setTab: (tab: string) => void;
  commits: number;
}

export const Tabs = (props: Props) => {
  // layer on a sound effect
  const setTab = async (tab: string) => {
    playClick();
    props.setTab(tab);
  };

  let text: string[] = [];
  if (props.tab === 'MINT')
    text = ['Get a kamigochi from the gacha pool!', '', 'Each kamigochi costs 1 $KAMI.'];
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
      <div>
        <ActionButton
          onClick={() => setTab('MINT')}
          text='Mint'
          disabled={props.tab === 'MINT'}
          size='vending'
        />
        <ActionButton
          onClick={() => setTab('REROLL')}
          text='Re-roll'
          disabled={props.tab === 'REROLL'}
          size='vending'
        />
        {props.commits > 0 && (
          <ActionButton
            onClick={() => setTab('COMMITS')}
            text='Pending'
            disabled={props.tab === 'COMMITS'}
            size='vending'
          />
        )}
      </div>
      <Tooltip text={text}>
        <Help src={helpIcon} />
      </Tooltip>
    </Container>
  );
};

const Container = styled.div`
  background-color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Help = styled.img`
  width: 1.5vw;
  margin: 0.1vh 0.5vw;
`;
