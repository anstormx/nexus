const fs = require('fs');
const { ethers, upgrades } = require("hardhat");

async function main() {
    const MultiTokenSwap = await ethers.getContractFactory("MultiTokenSwapV1");

    // Deploy the contract as upgradeable
    const multiTokenSwap = await upgrades.deployProxy(MultiTokenSwap, [
        "0x3dc75e45B0cef52444aF7103EDe4f3FBbDA29C5A", // Uniswap V3 SwapRouter address on Polygon
        3000 // Default fee tier
    ], { kind: 'uups' });

    await multiTokenSwap.waitForDeployment();

    const deployedAddress = await multiTokenSwap.getAddress();
    const implementationAddress = await upgrades.erc1967.getImplementationAddress(deployedAddress);

    const data = {
        address: deployedAddress,
        implementationAddress: implementationAddress,
        abi: JSON.parse(MultiTokenSwap.interface.formatJson())
    }

    //This writes the ABI and address to json file
    fs.writeFileSync('./src/utils/SwapV1.json', JSON.stringify(data));

    console.log(`MultiTokenSwap proxy deployed to: ${deployedAddress}`);
    console.log(`MultiTokenSwap implementation deployed to: ${implementationAddress}`);
}

main()
.then(() => process.exit(0))
.catch((error) => {
    console.error(error);
    process.exit(1);
});
