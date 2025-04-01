const fs = require("fs");
const { ethers } = require("hardhat");

async function main() {
	const NFTDescriptor = await ethers.getContractFactory("NFTDescriptor");

	const nftDescriptor = await NFTDescriptor.deploy();
	await nftDescriptor.waitForDeployment();
	const deployedAddress = await nftDescriptor.getAddress();

	const data = {
		address: deployedAddress,
		abi: JSON.parse(NFTDescriptor.interface.formatJson()),
	};

	fs.writeFileSync("./src/utils/nftDescriptor.json", JSON.stringify(data));

	console.log(`NFTDescriptor deployed to: ${deployedAddress}`);
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
