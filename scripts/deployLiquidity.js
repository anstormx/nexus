const fs = require('fs');
const { ethers } = require("hardhat");

async function main() {
    const LiquidityProvider = await ethers.getContractFactory("LiquidityProvider");

    // Deploy the contract
    const lp = await LiquidityProvider.deploy(
        "0xad3dAd15E634bAF2Da50ad7FD9407aa5E5068678", // Uniswap V3 SwapRouter address on Polygon
        3000 // Default fee tier
    )

    await lp.waitForDeployment();

    const deployedAddress = await lp.getAddress();

    const data = {
        address: deployedAddress,
        abi: JSON.parse(LiquidityProvider.interface.formatJson())
    }

    //This writes the ABI and address to json file
    fs.writeFileSync('./src/utils/liquidity.json', JSON.stringify(data));

    console.log(`LiquidityProvider deployed to: ${deployedAddress}`);
}

main()
.then(() => process.exit(0))
.catch((error) => {
    console.error(error);
    process.exit(1);
});
