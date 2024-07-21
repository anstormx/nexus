const { ethers } = require("hardhat");

const LIQUIDITY_PROVIDER_ADDRESS = "0xC3E5f32b683275781F11C657BE97e4f051748260";

const DAI_ADDRESS = "0x9cB75FECA0F92E29518eAcAF78cB81D642B2cc50";
const USDC_ADDRESS = "0x2eb068551d404E11aE2f294DB88BD12F5F35a09C";
const LINK_ADDRESS = "0xF222cE6a36A28560ADeC7AD7193e4f89a3D27ca4";
const WETH_ADDRESS = "0x53180AfA0de66EFe024D38B8715D1d48c1B3c1B7";

async function main() {
  const [signer] = await ethers.getSigners();

  const liquidityProvider = await ethers.getContractAt(
    "LiquidityProvider",
    LIQUIDITY_PROVIDER_ADDRESS,
    signer
  );

  const daiContract = await ethers.getContractAt("IERC20", DAI_ADDRESS, signer);
  const usdcContract = await ethers.getContractAt(
    "IERC20",
    USDC_ADDRESS,
    signer
  );
  const linkContract = await ethers.getContractAt(
    "IERC20",
    LINK_ADDRESS,
    signer
  );
  const wethContract = await ethers.getContractAt(
    "IERC20",
    WETH_ADDRESS,
    signer
  );

  // Check balances
  const daiBalance = await daiContract.balanceOf(signer.address);
  const usdcBalance = await usdcContract.balanceOf(signer.address);
  const linkBalance = await linkContract.balanceOf(signer.address);
  const wethBalance = await wethContract.balanceOf(signer.address);
  console.log(`DAI balance: ${ethers.formatUnits(daiBalance, 18)}`);
  console.log(`USDC balance: ${ethers.formatUnits(usdcBalance, 18)}`);
  console.log(`LINK balance: ${ethers.formatUnits(linkBalance, 18)}`);
  console.log(`WETH balance: ${ethers.formatUnits(wethBalance, 18)}`);

  // Approve tokens
  // const daiAmount = ethers.parseUnits("10000", 18);
  // const usdcAmount = ethers.parseUnits("10000", 18);
  // const linkAmount = ethers.parseUnits("10000", 18);
  // const usdcAmountForLink = ethers.parseUnits("200000", 18); // Assuming 1 LINK = 20 USDC
  // const daiAmountforLink = ethers.parseUnits("200000", 18); // Assuming 1 LINK = 20 DAI
  const wethAmount = ethers.parseUnits("300000", 18);
  // const daiforWethAmount = ethers.parseUnits("350", 18);
  const usdcforWethAmount = ethers.parseUnits("10", 18);
  // const linkforWethAmount = ethers.parseUnits("25", 18);

  console.log("Approving DAI...");
  // await daiContract.approve(LIQUIDITY_PROVIDER_ADDRESS, daiforWethAmount);
  console.log("Approving USDC...");
  await usdcContract.approve(LIQUIDITY_PROVIDER_ADDRESS, usdcforWethAmount);
  // console.log("Approving LINK...");
  // await linkContract.approve(LIQUIDITY_PROVIDER_ADDRESS, linkforWethAmount);
  // console.log("Approving WETH...");
  await wethContract.approve(LIQUIDITY_PROVIDER_ADDRESS, wethAmount);

  const tickLower = -887220; // Wider range
  const tickUpper = 887220; // Wider range

  try {
    const tx = await liquidityProvider.addLiquidity(
      WETH_ADDRESS,
      USDC_ADDRESS,
      wethAmount,
      usdcforWethAmount,
      tickLower,
      tickUpper,
      { gasLimit: 5000000 }
    );
    console.log("Transaction hash:", tx.hash);
    const receipt = await tx.wait();
    console.log("Transaction was mined in block", receipt.blockNumber);
    console.log("Liquidity added to pool successfully.");

    // Check balances
    const daiBalance = await daiContract.balanceOf(signer.address);
    const usdcBalance = await usdcContract.balanceOf(signer.address);
    const linkBalance = await linkContract.balanceOf(signer.address);
    const wethBalance = await wethContract.balanceOf(signer.address);
    console.log(`DAI balance: ${ethers.formatUnits(daiBalance, 18)}`);
    console.log(`USDC balance: ${ethers.formatUnits(usdcBalance, 18)}`);
    console.log(`LINK balance: ${ethers.formatUnits(linkBalance, 18)}`);
    console.log(`WETH balance: ${ethers.formatUnits(wethBalance, 18)}`);
  } catch (error) {
    console.error("Error adding liquidity:", error.message);
    if (error.data) {
      console.error("Error data:", error.data);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
