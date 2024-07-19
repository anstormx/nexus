const fs = require('fs');
const { ethers, upgrades } = require("hardhat");

async function main() {
    const MultiTokenSwap = await ethers.getContractFactory("MultiTokenSwap");

    // Deploy the contract as upgradeable
    const multiTokenSwap = await upgrades.deployProxy(MultiTokenSwap, [
        "0xE592427A0AEce92De3Edee1F18E0157C05861564", // Uniswap V3 SwapRouter address on Polygon
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
    fs.writeFileSync('./src/utils/abi.json', JSON.stringify(data));

    console.log(`MultiTokenSwap proxy deployed to: ${deployedAddress}`);
    console.log(`MultiTokenSwap implementation deployed to: ${implementationAddress}`);
}

main()
.then(() => process.exit(0))
.catch((error) => {
    console.error(error);
    process.exit(1);
});
