import styled from 'styled-components';

interface Props {
  icon: string | string[];
  color?: number;
}

export const FloatingOnMap = (props: Props) => {
  const icons = Array.isArray(props.icon) ? props.icon : [props.icon];
  const isMultiple = icons.length > 1;

  return (
    <Container>
      {icons.map((icon, index) => (
        <IconGroup key={index} $position={isMultiple ? index : undefined}>
          <Icon icon={icon} $color={props.color} key={`${icon}-${index}`} />
          <Shadow key={`${icon}-shadow-${index}`} />
        </IconGroup>
      ))}
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

const IconGroup = styled.div<{ $position?: number }>`
  position: absolute;
  width: 50%;
  height: 50%;

  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  justify-content: center;

  ${({ $position }) => {
    if ($position === 0) {
      return `
        top: 10%;
        left: 10%;
      `;
    } else if ($position === 1) {
      return `
        bottom: 10%;
        right: 10%;
      `;
    }
    return `
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 70%;
      height: 70%;
    `;
  }}
`;

// https://cdn-images-1.medium.com/v2/resize:fit:800/1*0iw7ymhZXKuggiTelXgzGQ.jpeg
//  after applying sepia(1) and saturate(500%), hue-rotate will have a starting point of 40 deg aprox
const Icon = styled.div<{ icon: string; $color?: number | string }>`
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-end;
  align-items: center;
  height: 100%;
  width: 100%;
  position: relative;
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
  transform: translatey(400%);
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
      width: 35%;
    }
    50% {
      width: 63%;
    }
    100% {
      width: 30%;
    }
  }
`;
