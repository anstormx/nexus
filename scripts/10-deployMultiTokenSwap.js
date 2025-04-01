const fs = require('fs');
const { ethers, upgrades } = require("hardhat");
const {
	address: swapRouterAddress,
} = require("../src/utils/swapRouter.json");

async function main() {
    console.log("swapRouterAddress", swapRouterAddress);

    const MultiTokenSwap = await ethers.getContractFactory("MultiTokenSwapV1");

    const multiTokenSwap = await upgrades.deployProxy(MultiTokenSwap, [
        swapRouterAddress,
        3000
    ]);

    await multiTokenSwap.waitForDeployment();
    const deployedAddress = await multiTokenSwap.getAddress();
    const implementationAddress = await upgrades.erc1967.getImplementationAddress(deployedAddress);

    const data = {
        address: deployedAddress,
        implementationAddress: implementationAddress,
        abi: JSON.parse(MultiTokenSwap.interface.formatJson())
	}

	fs.writeFileSync("./src/utils/multiTokenSwapV1.json", JSON.stringify(data));

    console.log(`MultiTokenSwap proxy deployed to: ${deployedAddress}`);
    console.log(`MultiTokenSwap implementation deployed to: ${implementationAddress}`);
}

main()
.then(() => process.exit(0))
.catch((error) => {
    console.error(error);
    process.exit(1);
});
