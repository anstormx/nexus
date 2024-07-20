const fs = require('fs');
const { ethers } = require("hardhat");
const contract = require('@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json');   

async function main() {
    const SwapRouter = await ethers.getContractFactory(contract.abi, contract.bytecode);

    // Deploy the contract
    const swapRouter = await SwapRouter.deploy(
        "0xad3dAd15E634bAF2Da50ad7FD9407aa5E5068678", // Uniswap V3 Factory address on Polygon
        "0x53180AfA0de66EFe024D38B8715D1d48c1B3c1B7" // WETH address on Polygon
    );

    await swapRouter.waitForDeployment();

    const deployedAddress = await swapRouter.getAddress();

    const data = {
        address: deployedAddress,
        abi: JSON.parse(SwapRouter.interface.formatJson())
    }

    //This writes the ABI and address to json file
    fs.writeFileSync('./src/utils/swapRouter.json', JSON.stringify(data));

    console.log(`SwapRouter deployed to: ${deployedAddress}`);
}

main()
.then(() => process.exit(0))
.catch((error) => {
    console.error(error);
    process.exit(1);
});
