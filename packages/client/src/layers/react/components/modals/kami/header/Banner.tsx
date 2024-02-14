import { Kami } from 'layers/network/shapes/Kami';
import styled from 'styled-components';

import { StatIcons } from 'assets/images/icons/stats';
import { Account } from 'layers/network/shapes/Account';
import { ExperienceBar } from 'layers/react/components/library/ExperienceBar';
import { Tooltip } from 'layers/react/components/library/Tooltip';
import { useSelected } from 'layers/react/store/selected';
import { useVisibility } from 'layers/react/store/visibility';
import { playClick } from 'utils/sounds';

interface Props {
  data: {
    account: Account;
    kami: Kami;
  };
  actions: {
    levelUp: (kami: Kami) => void;
  };
}

// TODO: disable level-up when kami is too far or not urs
export const Banner = (props: Props) => {
  const { account, kami } = props.data;

  const { setAccount } = useSelected();
  const { modals, setModals } = useVisibility();
  const statsArray = Object.entries(kami.stats);
  const affinities = kami.affinities?.join(' | ');
  const statsDetails = new Map(
    Object.entries({
      health: {
        description: 'Health defines how resilient a Kami is to accumulated damage',
        image: StatIcons.health,
        base: kami.stats.health,
        bonus: kami.bonusStats.health,
      },
      power: {
        description: 'Power determines the potential rate at which $MUSU can be farmed',
        image: StatIcons.power,
        base: kami.stats.power,
        bonus: kami.bonusStats.power,
      },
      violence: {
        description: 'Violence dictates the threshold at which a Kami can liquidate others',
        image: StatIcons.violence,
        base: kami.stats.violence,
        bonus: kami.bonusStats.violence,
      },
      harmony: {
        description: 'Harmony divines resting recovery rate and defends against violence',
        image: StatIcons.harmony,
        base: kami.stats.harmony,
        bonus: kami.bonusStats.harmony,
      },
      slots: {
        description: 'Slots are room for upgrades ^_^',
        image: StatIcons.slots,
        base: kami.stats.slots,
        bonus: kami.bonusStats.slots,
      },
    })
  );

  const isMine = (kami: Kami) => {
    return kami.account?.index === account.index;
  };

  const getLevelUpDisabledReason = () => {
    if (!isMine(kami)) return 'not ur kami';
  };

  const handleAccountClick = () => {
    if (!isMine(kami))
      return () => {
        setAccount(kami.account?.index || 0);
        setModals({
          ...modals,
          account: true,
          kami: false,
          party: false,
          map: false,
        });
        playClick();
      };
  };

  return (
    <Container>
      <Image src={kami.uri} />
      <Content>
        <ContentTop>
          <TitleRow>
            <Title>{kami.name}</Title>
            <Subtext>{affinities}</Subtext>
          </TitleRow>
          <TitleRow>
            <ExperienceBar
              level={kami.level}
              current={kami.experience.current}
              total={kami.experience.threshold}
              triggerLevelUp={() => props.actions.levelUp(kami)}
              disabled={!isMine(kami)}
              disabledReason={getLevelUpDisabledReason()}
            />
          </TitleRow>
        </ContentTop>
        <ContentMiddle>
          {statsArray.map((stat: [string, number]) => {
            const details = statsDetails.get(stat[0]);
            const valueString = `${details?.base! + details?.bonus!}`;
            const tooltipText = [
              `${details?.base} + ${details?.bonus}`,
              details?.description ?? '',
            ];
            return (
              <Tooltip key={stat[0]} text={tooltipText} grow>
                <InfoBox>
                  <Icon src={details?.image} />
                  <InfoContent>{valueString}</InfoContent>
                </InfoBox>
              </Tooltip>
            );
          })}
        </ContentMiddle>
        <Footer>
          <FooterText onClick={handleAccountClick()}>
            {isMine(kami) ? 'yours' : kami.account?.name}
          </FooterText>
        </Footer>
      </Content>
    </Container>
  );
};

const Container = styled.div`
  border-bottom: solid black 0.15vw;
  color: black;

  display: flex;
  flex-flow: row nowrap;
`;

const Image = styled.img`
  border-radius: 8px 0px 0px 0px;
  border-right: solid black 0.15vw;
  height: 14vw;
`;

const Icon = styled.img`
  height: 2vw;
`;

const Content = styled.div`
  flex-grow: 1;
  padding: 0.7vw;

  display: flex;
  flex-flow: column nowrap;
  justify-content: space-between;
  position: relative;
`;

const ContentTop = styled.div`
  display: flex;
  flex-flow: column nowrap;
`;

const TitleRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: flex-end;
  margin: 1vw 0.3vw 0.5vw 0.3vw;
`;

const Title = styled.div`
  background-color: #ffffff;
  color: black;
  font-family: Pixel;
  font-size: 2vw;
`;

const Subtext = styled.div`
  padding: 0 0 0.1vw 0.6vw;

  color: #666;
  font-family: Pixel;
  font-size: 0.9vw;
`;

const ContentMiddle = styled.div`
  flex-grow: 1;
  width: 80%;
  display: flex;
  flex-direction: row wrap;
  align-items: center;
  justify-content: flex-start;
`;

const InfoBox = styled.div`
  border: solid black 0.12vw;
  border-radius: 5px;
  margin: 0.3vw;
  padding: 0.3vw;

  display: flex;
  flex-direction: row;
  &:hover {
    background-color: #ddd;
  }
`;

const InfoContent = styled.div`
  color: black;
  padding: 0.3vw;
  align-self: center;

  font-family: Pixel;
  font-size: 0.8vw;
  font-weight: 600;
  margin: auto;
`;

const Footer = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 0.7vw;

  display: flex;
  justify-content: flex-end;
`;

const FooterText = styled.div`
  font-family: Pixel;
  font-size: 0.6vw;
  text-align: right;
  color: #666;

  ${({ onClick }) =>
    onClick &&
    `
    &:hover {
      opacity: 0.6;
      cursor: pointer;
      text-decoration: underline;
    }
  `}
`;
