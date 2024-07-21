const { ethers } = require("hardhat");

const LIQUIDITY_PROVIDER_ADDRESS = "0xC3E5f32b683275781F11C657BE97e4f051748260";

const DAI_ADDRESS = "0x9cB75FECA0F92E29518eAcAF78cB81D642B2cc50";
const USDC_ADDRESS = "0x2eb068551d404E11aE2f294DB88BD12F5F35a09C";
const LINK_ADDRESS = "0xF222cE6a36A28560ADeC7AD7193e4f89a3D27ca4";

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

  // Check balances
  const daiBalance = await daiContract.balanceOf(signer.address);
  const usdcBalance = await usdcContract.balanceOf(signer.address);
  const linkBalance = await linkContract.balanceOf(signer.address);
  console.log(`DAI balance: ${ethers.formatUnits(daiBalance, 18)}`);
  console.log(`USDC balance: ${ethers.formatUnits(usdcBalance, 18)}`);
  console.log(`LINK balance: ${ethers.formatUnits(linkBalance, 18)}`);

  // Approve tokens
  const daiAmount = ethers.parseUnits("1000", 18);
  const usdcAmount = ethers.parseUnits("1000", 18);
  const linkAmount = ethers.parseUnits("1000", 18);
  const usdcAmountForLink = ethers.parseUnits("20000", 18); // Assuming 1 LINK = 20 USDC

  console.log("Approving DAI...");
  await daiContract.approve(LIQUIDITY_PROVIDER_ADDRESS, daiAmount);
  console.log("Approving USDC...");
  await usdcContract.approve(
    LIQUIDITY_PROVIDER_ADDRESS,
    usdcAmount + usdcAmountForLink
  );
  console.log("Approving LINK...");
  await linkContract.approve(LIQUIDITY_PROVIDER_ADDRESS, linkAmount);

  // Add liquidity to DAI/USDC pool
  //   console.log("Adding liquidity to DAI/USDC pool...");

  //Add liquidity to LINK/USDC pool
  console.log("Adding liquidity to LINK/USDC pool...");
  const tickLower = -887220; // Wider range
  const tickUpper = 887220; // Wider range

  try {
    // const tx = await liquidityProvider.addLiquidity(
    //   DAI_ADDRESS,
    //   USDC_ADDRESS,
    //   daiAmount,
    //   usdcAmount,
    //   tickLower,
    //   tickUpper,
    //   { gasLimit: 5000000 }
    // );
    // console.log("Transaction hash:", tx.hash);
    // const receipt = await tx.wait();
    // console.log("Transaction was mined in block", receipt.blockNumber);
    // console.log("Liquidity added to DAI/USDC pool successfully.");
    //     DAI balance: 1000000.0
    // USDC balance: 1000000.0
    // Approving DAI...
    // Approving USDC...
    // Adding liquidity to DAI/USDC pool...
    // Transaction hash: 0x2128c8dafa58ea761e6e73e2e55e9212f6308f7629531fcc13a9af9122f33a30
    // Transaction was mined in block 9729644
    // Liquidity added to DAI/USDC pool successfully.

    const tx = await liquidityProvider.addLiquidity(
      LINK_ADDRESS,
      USDC_ADDRESS,
      linkAmount,
      usdcAmountForLink,
      tickLower,
      tickUpper,
      { gasLimit: 5000000 }
    );
    console.log("Transaction hash:", tx.hash);
    const receipt = await tx.wait();
    console.log("Transaction was mined in block", receipt.blockNumber);
    console.log("Liquidity added to LINK/USDC pool successfully.");
    // DAI balance: 999000.0
    // USDC balance: 999000.0
    // LINK balance: 1000000.0
    // Approving DAI...
    // Approving USDC...
    // Approving LINK...
    // Adding liquidity to LINK/USDC pool...
    // Transaction hash: 0x6ee7305abe051bb4f7113fd531caeeb78a9ab6f36cbc87e296a82b2f8c6b1a09
    // Transaction was mined in block 9729891
    // Liquidity added to LINK/USDC pool successfully.
  } catch (error) {
    console.error("Error adding liquidity:", error.message);
    if (error.data) {
      console.error("Error data:", error.data);
    }
    // Try to get more information about the revert reason
    try {
      await liquidityProvider.callStatic.addLiquidity(
        DAI_ADDRESS,
        USDC_ADDRESS,
        daiAmount,
        usdcAmount,
        tickLower,
        tickUpper
      );
    } catch (callError) {
      console.error("Call error:", callError.message);
      if (callError.data) {
        console.error("Call error data:", callError.data);
      }
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
