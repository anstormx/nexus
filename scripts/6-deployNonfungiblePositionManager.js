const fs = require("fs");
const { ethers } = require("hardhat");
const {
	address: factoryAddress,
} = require("../src/utils/uniswapV3Factory.json");
const { address: wethAddress } = require("../src/utils/tokenABI/WETH.json");
const {
	address: nonfungibleTokenPositionDescriptorAddress,
} = require("../src/utils/nonfungibleTokenPositionDescriptor.json");

async function main() {
	console.log("factoryAddress", factoryAddress);
	console.log("wethAddress", wethAddress);
	console.log(
		"nonfungibleTokenPositionDescriptorAddress",
		nonfungibleTokenPositionDescriptorAddress
	);

	const NonfungiblePositionManager = await ethers.getContractFactory("NonfungiblePositionManager");

	const nonfungiblePositionManager = await NonfungiblePositionManager.deploy(
		factoryAddress,
		wethAddress,
		nonfungibleTokenPositionDescriptorAddress
	);
	await nonfungiblePositionManager.waitForDeployment();
	const deployedAddress = await nonfungiblePositionManager.getAddress();

	const data = {
		address: deployedAddress,
		abi: JSON.parse(NonfungiblePositionManager.interface.formatJson()),
	};

	fs.writeFileSync(
		"./src/utils/nonfungiblePositionManager.json",
		JSON.stringify(data)
	);

	console.log(`NonfungiblePositionManager deployed to: ${deployedAddress}`);
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
