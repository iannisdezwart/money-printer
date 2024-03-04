import numeric from "numeric";

export type CurveFitResult = {
  coefficients: number[];
  error: number;
};

export const computePolynomial = (x: number, coefficients: number[]) => {
  return coefficients.reduce(
    (acc, curr, index) => acc + curr * Math.pow(x, index),
    0
  );
};

export const derivePolynomial = (coefficients: number[]) => {
  return coefficients
    .slice(1)
    .map((coefficient, index) => coefficient * (index + 1));
};

const computeError = (
  points: { x: number[]; y: number[] },
  coefficients: number[]
) => {
  let error = 0;

  for (let i = 0; i < points.x.length; i++) {
    const yHat = coefficients.reduce(
      (acc, curr, index) => acc + curr * Math.pow(points.x[i], index),
      0
    );

    error += Math.pow(yHat - points.y[i], 2);
  }

  return error;
};

export const curveFit = (
  points: { x: number[]; y: number[] },
  order: number
): CurveFitResult => {
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
  const coefficients = numeric.dotMV(numeric.dotMMbig(dotInv, dot2), [1]);

  return {
    coefficients,
    error: computeError(points, coefficients),
  };
};
