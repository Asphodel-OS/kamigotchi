export const ChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  layout: {
    padding: {
      right: window.innerWidth * 0.03,
    },
  },
  scales: {
    y1: {
      beginAtZero: true,
      display: true,
      ticks: { display: false },
      position: 'right',
    },
    y2: {
      beginAtZero: true,
      display: true,
      ticks: { display: false },
      position: 'left',
      grid: {
        drawOnChartArea: false,
      },
    },
    x: { ticks: { display: false } },
  },
  plugins: {
    legend: { display: false },
    crosshairs: {
      color: 'black',
    },
    tooltip: {
      enabled: true,
    },
  },
};

type CrosshairOptions = {
  width: number;
  color: string;
  dash: number[];
  displayPrice: boolean;
};

export const CrosshairPlugin = {
  id: 'crosshairs',
  defaults: {
    width: 1,
    color: 'black',
    dash: [3, 4],
    displayPrice: true,
  },
  afterInit: (chart: any, args: any, opts: CrosshairOptions) => {
    chart.crosshairs = {
      x: 0,
      y: 0,
    };
  },
  afterEvent: (chart: any, args: any) => {
    const { inChartArea } = args;
    const { type, x, y } = args.event;
    if (type === 'mousemove') {
      chart.crosshairs = { x, y, shouldDraw: inChartArea };
    } else if (type === 'mouseout') {
      chart.crosshairs = { x: 0, y: 0, shouldDraw: false };
    }
    chart.draw();
  },
  afterDatasetsDraw: (chart: any, args: any, opts: CrosshairOptions) => {
    const { ctx } = chart;
    const { top, bottom, left, right } = chart.chartArea;
    const { y1: yScale } = chart.scales;
    const { x, y, shouldDraw } = chart.crosshairs;
    if (!shouldDraw) return;

    ctx.save();

    ctx.beginPath();
    ctx.lineWidth = opts.width;
    ctx.strokeStyle = opts.color;
    ctx.setLineDash(opts.dash);
    ctx.moveTo(x, bottom);
    ctx.lineTo(x, top);
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();

    // price label
    if (opts.displayPrice) {
      ctx.fillStyle = 'rgb(75, 192, 1)';
      const width = right - left;
      const rectWidth = width * 0.07;
      const rectHeight = width * 0.024;
      ctx.fillRect(right, y - rectHeight / 2, rectWidth, rectHeight);

      ctx.font = 'bold 0.75vw sans-serif';
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const price = Math.floor(yScale.getValueForPixel(y));
      ctx.fillText(price, right + rectWidth / 2, y);
      ctx.restore();
    }
  },
};
