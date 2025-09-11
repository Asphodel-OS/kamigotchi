import XIcon from '@mui/icons-material/X';
import { useLinkAccount, usePrivy } from '@privy-io/react-auth';
import moment from 'moment';
import styled from 'styled-components';

import { IconButton } from 'app/components/library/buttons/IconButton';
import { TextTooltip } from 'app/components/library/poppers/TextTooltip';
import SocialIcon from 'assets/images/icons/menu/social.png';

export const TwitterPrivyAccountLink = () => {
  const { ready, authenticated, user, unlinkTwitter } = usePrivy();
  const { linkTwitter } = useLinkAccount();

  const twitterAccount = user?.linkedAccounts.find((acc) => acc.type === 'twitter_oauth');

  const handleTwitterUnlink = async () => {
    if (!twitterAccount?.subject) return;
    await unlinkTwitter(twitterAccount?.subject);
  };

  return (
    <Container>
      {!twitterAccount ? (
        <>
          <TextTooltip
            text={[
              <span key="unlinked-text">
                Link <XIcon style={{ fontSize: '1.2vw', verticalAlign: 'middle' }} /> Account
              </span>
            ]}
          >
            <IconButton
              img={SocialIcon}
              onClick={linkTwitter}
              disabled={!(ready && authenticated)}
              color='transparent'
              noBorder
              filter="opacity(0.5)"
            />
          </TextTooltip>
        </>
      ) : (
        <>
          <TextTooltip
            text={[
              <XIcon key="x-icon" style={{ fontSize: '1.2vw', marginBottom: '0.7vw' }} />,
              `${user?.twitter?.username}`,
              `Linked ${moment(twitterAccount?.firstVerifiedAt).fromNow()}`,
              `\n`,
              `(Click to unlink)`,
            ]}
          >
            <IconButton
              img={SocialIcon}
              onClick={handleTwitterUnlink}
              disabled={!(ready && authenticated)}
              color='transparent'
              noBorder
              filter="drop-shadow(0 0 3px #2E7D32)"
            />
          </TextTooltip>
        </>
      )}
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  gap: 0.3vw;
`;