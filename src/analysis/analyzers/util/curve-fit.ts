import numeric from "numeric";

export const curveFit = (
  points: { x: number[]; y: number[] },
  order: number
) => {
  const xMatrix = [];
  let xTemp = [];
  const yMatrix = numeric.transpose([points.y]);

  for (let j = 0; j < points.x.length; j++) {
    xTemp = [];
    for (let i = 0; i <= order; i++) {
      xTemp.push(1 * Math.pow(points.x[j], i));
    }
    xMatrix.push(xTemp);
  }

  const xMatrixT = numeric.transpose(xMatrix);
  const dot1 = numeric.dotMMbig(xMatrixT, xMatrix);
  const dotInv = numeric.inv(dot1);
  const dot2 = numeric.dotMMbig(xMatrixT, yMatrix);
  const solution = numeric.dotMMbig(dotInv, dot2);

  return numeric.dotMV(solution, [1]);
};
