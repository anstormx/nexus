import bn from "bignumber.js";

export const decodePriceSqrt = (sqrtPriceX96) => {
  bn.config({ EXPONENTIAL_AT: 999999, DECIMAL_PLACES: 40 });
  const price = new bn(sqrtPriceX96.toString());
  const squaredPrice = price.times(price);
  const denominator = new bn(2).pow(192);
  return squaredPrice.div(denominator).toNumber();
};
