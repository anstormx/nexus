const fs = require("fs");
const { ethers } = require("hardhat");
const {
	address: factoryAddress,
} = require("../src/utils/uniswapV3Factory.json");
const {
	address: nonfungiblePositionManagerAddress,
} = require("../src/utils/nonfungiblePositionManager.json");

async function main() {
	console.log("factoryAddress", factoryAddress);
	console.log(
		"nonfungiblePositionManagerAddress",
		nonfungiblePositionManagerAddress
	);

	const LiquidityProvider = await ethers.getContractFactory(
		"LiquidityProvider"
	);

	const lp = await LiquidityProvider.deploy(
		factoryAddress,
		nonfungiblePositionManagerAddress
	);

	await lp.waitForDeployment();
	const deployedAddress = await lp.getAddress();
	const data = {
		address: deployedAddress,
		abi: JSON.parse(LiquidityProvider.interface.formatJson()),
	};

	fs.writeFileSync("./src/utils/liquidityProvider.json", JSON.stringify(data));

	console.log(`LiquidityProvider deployed to: ${deployedAddress}`);
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
