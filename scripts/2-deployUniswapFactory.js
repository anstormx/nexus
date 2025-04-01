const fs = require("fs");
const { ethers } = require("hardhat");

async function main() {
	const Factory = await ethers.getContractFactory("UniswapV3Factory");

	const factory = await Factory.deploy();
	await factory.waitForDeployment();
	const deployedAddress = await factory.getAddress();

	const data = {
		address: deployedAddress,
		abi: JSON.parse(Factory.interface.formatJson()),
	};

	fs.writeFileSync("./src/utils/uniswapV3Factory.json", JSON.stringify(data));

	console.log(`Factory deployed to: ${deployedAddress}`);
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
