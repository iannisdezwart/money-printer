import { expect, use } from "chai";
import chaiAlmost from "chai-almost";
import { describe, it } from "node:test";
import { curveFit } from "../src/analysis/analyzers/util/curve-fit.js";

use(chaiAlmost());

describe("curve-fit", () => {
  it("order 2, x^2", () => {
    const points = {
      x: [0, 1, 2, 3, 4, 5],
      y: [0, 1, 4, 9, 16, 25],
    };
    const expected = [0, 0, 1];

    expect(curveFit(points, 2)).to.be.deep.almost(expected);
  });

  it("order 2, x^2 + 1", () => {
    const points = {
      x: [0, 1, 2, 3, 4, 5],
      y: [1, 2, 5, 10, 17, 26],
    };
    const expected = [1, 0, 1];

    expect(curveFit(points, 2)).to.be.deep.almost(expected);
  });

  it("order 1, x - 9999", () => {
    const points = {
      x: [0, 1, 2, 3, 4, 5],
      y: [-9999, -9998, -9997, -9996, -9995, -9994],
    };
    const expected = [-9999, 1];

    expect(curveFit(points, 1)).to.be.deep.almost(expected);
  });

  it("order 5, x", () => {
    const points = {
      x: [0, 1, 2, 3, 4, 5],
      y: [0, 1, 2, 3, 4, 5],
    };
    const expected = [0, 1, 0, 0, 0, 0];

    expect(curveFit(points, 5)).to.be.deep.almost(expected);
  });

  it("order 1, x^2", () => {
    const points = {
      x: [0, 1, 2, 3, 4, 5],
      y: [0, 1, 4, 9, 16, 25],
    };
    const expected = [-3.33333333333, 5];

    expect(curveFit(points, 1)).to.be.deep.almost(expected);
  });
});
