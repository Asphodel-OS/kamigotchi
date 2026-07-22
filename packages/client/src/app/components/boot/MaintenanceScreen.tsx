import styled from 'styled-components';

// font.css must be imported here: this screen renders from a bare createRoot
// before app/boot.tsx (the usual importer of the Pixel @font-face) ever runs.
import 'app/styles/font.css';
import { loadingScreens } from 'assets/images/loading';

// Full-client maintenance wall, shown when VITE_MAINTENANCE === 'true'.
// Rendered from boot() IN PLACE OF the app: the network layer (RPC, kamigaze,
// wallet) never initializes, so users cannot transact against a world that is
// mid-ceremony. Self-contained by design — no stores, providers or network
// hooks, since none of that exists when it mounts. Banner pick mirrors
// BootScreen's rotation but seeds locally (no useNetwork store).
const bannerKeys = Object.keys(loadingScreens);
const bannerIndex = Math.floor(Math.random() * bannerKeys.length);

export const MaintenanceScreen = () => {
  return (
    <Container>
      <Image src={Object.values(loadingScreens)[bannerIndex]} />
      <Dimmer />
      <StatusContainer>
        <Title>KAMIGOTCHI UNDER MAINTENANCE</Title>
        <Subline>back soon! check the Discord for updates</Subline>
      </StatusContainer>
      <TagContainer>
        <Tag>banner by: </Tag>
        <Tag>{bannerKeys[bannerIndex]}</Tag>
      </TagContainer>
    </Container>
  );
};

const Container = styled.div`
  position: fixed;
  inset: 0;
  background-color: #000;
  overflow: hidden;
  user-select: none;
  z-index: 2;
`;

const Image = styled.img`
  height: 100%;
  width: 100%;
  user-drag: none;
`;

const Dimmer = styled.div`
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
`;

const StatusContainer = styled.div`
  position: absolute;
  bottom: 25vh;
  gap: 3vh;

  width: 100%;
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;
  padding: 0 5vw;
`;

const Title = styled.div`
  color: #fff;
  text-align: center;
  font-size: 3vh;
  text-shadow: 0.2vh 0.2vh 0 #000;
`;

const Subline = styled.div`
  color: #bbb;
  text-align: center;
  font-size: 2vh;
  text-shadow: 0.2vh 0.2vh 0 #000;
`;

const TagContainer = styled.div`
  position: absolute;
  bottom: calc(5vh + env(safe-area-inset-bottom));
  left: calc(5vw + env(safe-area-inset-left));
  width: 100%;
`;

const Tag = styled.div`
  color: #fff;
  text-align: left;
  font-size: 1.8vh;
  line-height: 2.4vh;
`;
