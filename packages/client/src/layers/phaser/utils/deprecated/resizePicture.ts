export const resizePicture = () => {
  const screenSizes = [
    { width: 1366, height: 768, scale: 0.75 },
    { width: 1536, height: 864, scale: 0.82 },
    { width: 1920, height: 1080, scale: 0.85 },
  ];
  const { clientWidth: windowWidth, clientHeight: windowHeight } =
    document.documentElement;

  const screenSize = screenSizes.find(
    ({ width, height }) => windowWidth <= width && windowHeight <= height
  );

  const scale = screenSize?.scale ?? 1;
  const widthDiff = screenSize ? (screenSize.width - windowWidth) / 2 : 0;
  const heightDiff = screenSize ? (screenSize.height - windowHeight) / 2 : 0;

  return { scale, diff: { widthDiff, heightDiff } };
};
