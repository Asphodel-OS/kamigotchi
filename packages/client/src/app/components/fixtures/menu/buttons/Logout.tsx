import { useLogin, usePrivy } from '@privy-io/react-auth';
import styled from 'styled-components';

import { Tooltip } from 'app/components/library';
import { clickFx, hoverFx } from 'app/styles/effects';
import { logoutIcon } from 'assets/images/icons/actions';

export const LogoutMenuButton = () => {
  const { ready, authenticated, logout } = usePrivy();
  const { login } = useLogin({
    onError: (error) => {
      console.error(error);
    },
  });

  const handleClick = () => {
    if (ready && !authenticated) login(); // not used anymore
    if (ready && authenticated) logout();
  };

  return (
    <Tooltip text={['Logout']}>
      <Button onClick={handleClick}>
        <Image src={logoutIcon} />
        <Text>Logout</Text>
      </Button>
    </Tooltip>
  );
};

const Button = styled.div`
  background-color: #fff;
  border-radius: 0.9vh;
  border: solid black 0.15vw;
  height: 4.5vh;
  padding: 0.4vh;
  gap: 0.4vh;

  cursor: pointer;
  pointer-events: auto;

  display: flex;
  flex-flow: row nowrap;
  justify-content: center;
  align-items: center;

  &:hover {
    animation: ${() => hoverFx()} 0.2s;
    transform: scale(1.05);
  }
  &:active {
    animation: ${() => clickFx()} 0.3s;
  }
`;

const Image = styled.img`
  height: 100%;
  width: auto;
`;

const Text = styled.div`
  color: black;
  font-size: 1.2vh;
  text-align: left;
`;
