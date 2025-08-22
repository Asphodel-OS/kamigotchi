import styled from 'styled-components';

interface Props {
  icon: string;
  color?: number;
}
export const FloatingOnMap = (props: Props) => {
  return (
    <Container>
      <Icon icon={props.icon} $color={props.color} />
      <Shadow />
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  display: flex;
  flex-flow: column nowrap;
  align-content: center;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  pointer-events: none;
`;

// https://cdn-images-1.medium.com/v2/resize:fit:800/1*0iw7ymhZXKuggiTelXgzGQ.jpeg
//  after applying sepia(1) and saturate(500%), hue-rotate will have a starting point of 40 deg aprox
const Icon = styled.div<{ icon: string; $color?: number | string }>`
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-end;
  align-items: center;
  height: 70%;
  width: 70%;
  position: absolute;
  ${({ icon }) => `background-image: url(${icon});`}
  background-position: center;
  background-repeat: no-repeat;
  background-size: contain;
  animation: 2s infinite alternate floating;
  animation-timing-function: linear;
  ${({ $color }) =>
    $color !== 0 ? `filter: sepia(1) saturate(500%) hue-rotate(${$color}deg);` : ''}
  z-index: 2;
  @keyframes floating {
    0% {
      transform: translateY(-25%);
    }
    50% {
      transform: translateY(-5%);
    }
    100% {
      transform: translateY(-25%);
    }
  }
`;

const Shadow = styled.div`
  position: absolute;
  height: 15%;
  animation: 2s infinite alternate shadow;
  animation-timing-function: linear;
  transform: translatey(260%);
  border-radius: 50%;
  background: radial-gradient(
    ellipse,
    rgba(0, 0, 0, 0.8) 0%,
    rgba(0, 0, 0, 0.6) 40%,
    rgba(0, 0, 0, 0.3) 70%,
    transparent 100%
  );

  @keyframes shadow {
    0% {
      width: 25%;
    }
    50% {
      width: 43%;
    }
    100% {
      width: 30%;
    }
  }
`;
