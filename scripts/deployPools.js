// Token addresses
const DAI_ADDRESS = "0x9cB75FECA0F92E29518eAcAF78cB81D642B2cc50";
const USDC_ADDRESS = "0x2eb068551d404E11aE2f294DB88BD12F5F35a09C";
const LINK_ADDRESS = "0xF222cE6a36A28560ADeC7AD7193e4f89a3D27ca4";

// Uniswap contract address
const WETH_ADDRESS = "0x53180AfA0de66EFe024D38B8715D1d48c1B3c1B7";
const FACTORY_ADDRESS = "0xad3dAd15E634bAF2Da50ad7FD9407aa5E5068678";
const SWAP_ROUTER_ADDRESS = "0x3dc75e45B0cef52444aF7103EDe4f3FBbDA29C5A";
const NFT_DESCRIPTOR_ADDRESS = "0xff6dd472749B858b9265F0a471DB66C39B03421c";
const POSITION_DESCRIPTOR_ADDRESS =
  "0x486b4Fa4fAA3d1934593B68350c0e11AB31640dD";
const POSITION_MANAGER_ADDRESS = "0x05eD65Dbde3c5FD660bd327e933D784f6eFD7BB5";
const LIQUIDITY_PROVIDER_ADDRESS = "0xC3E5f32b683275781F11C657BE97e4f051748260";

const { ethers } = require("hardhat");
const bn = require("bignumber.js");
bn.config({ EXPONENTIAL_AT: 999999, DECIMAL_PLACES: 40 });

function encodePriceSqrt(reserve1, reserve0) {
  return ethers.parseUnits(
    new bn(reserve1.toString())
      .div(reserve0.toString())
      .sqrt()
      .multipliedBy(new bn(2).pow(96))
      .integerValue(3)
      .toString(),
    0
  );
}

async function main() {
  //   const [owner] = await ethers.getSigners();

  // Get the LiquidityProvider contract instance
  const liquidityProvider = await ethers.getContractAt(
    "LiquidityProvider",
    LIQUIDITY_PROVIDER_ADDRESS
  );

  // // Create a pool for DAI/USDC with an initial price of 1:1
  // const daiusdcPrice = encodePriceSqrt(1, 1);
  // console.log("Creating DAI/USDC pool...");
  // await liquidityProvider.createPool(DAI_ADDRESS, USDC_ADDRESS, daiusdcPrice);

  // console.log("DAI/USDC pool created successfully.");

  // console.log("Creating LINK/USDC pool...");
  // const linkUsdcPrice = encodePriceSqrt(20, 1); // Assuming 1 LINK = 20 USDC
  // await liquidityProvider.createPool(LINK_ADDRESS, USDC_ADDRESS, linkUsdcPrice);
  // console.log("LINK/USDC pool created successfully.");

  console.log("Creating LINK/DAI pool...");
  const linkDaiPrice = encodePriceSqrt(20, 1); // Assuming 1 LINK = 20 DAI
  await liquidityProvider.createPool(LINK_ADDRESS, DAI_ADDRESS, linkDaiPrice);
  console.log("LINK/DAI pool created successfully.");
  
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
