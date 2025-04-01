const fs = require("fs");
const { ethers } = require("hardhat");
const {
	address: factoryAddress,
} = require("../src/utils/uniswapV3Factory.json");
const { address: wethAddress } = require("../src/utils/tokenABI/WETH.json");

async function main() {
	console.log("factoryAddress", factoryAddress);
	console.log("wethAddress", wethAddress);
    
	const SwapRouter = await ethers.getContractFactory("SwapRouter");

	const swapRouter = await SwapRouter.deploy(factoryAddress, wethAddress);
	await swapRouter.waitForDeployment();
	const deployedAddress = await swapRouter.getAddress();

	const data = {
		address: deployedAddress,
		abi: JSON.parse(SwapRouter.interface.formatJson()),
	};

	fs.writeFileSync("./src/utils/swapRouter.json", JSON.stringify(data));

	console.log(`SwapRouter deployed to: ${deployedAddress}`);
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
