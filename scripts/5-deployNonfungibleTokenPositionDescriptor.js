const fs = require("fs");
const { ethers } = require("hardhat");
const contract = require("../artifacts/contracts/NonfungibleTokenPositionDescriptor.sol/NonfungibleTokenPositionDescriptor.json");
const {
	address: nftDescriptorAddress,
} = require("../src/utils/nftDescriptor.json");
const { address: wethAddress } = require("../src/utils/tokenABI/WETH.json");

const linkLibraries = ({ bytecode, linkReferences }, libraries) => {
	Object.keys(linkReferences).forEach((fileName) => {
		Object.keys(linkReferences[fileName]).forEach((contractName) => {
			if (!libraries.hasOwnProperty(contractName)) {
				throw new Error(`Missing link library name ${contractName}`);
			}
			const address = ethers
				.getAddress(libraries[contractName])
				.toLowerCase()
				.slice(2);
			linkReferences[fileName][contractName].forEach(
				({ start, length }) => {
					const start2 = 2 + start * 2;
					const length2 = length * 2;
					bytecode = bytecode
						.slice(0, start2)
						.concat(address)
						.concat(
							bytecode.slice(start2 + length2, bytecode.length)
						);
				}
			);
		});
	});
	return bytecode;
};

async function main() {
	console.log("nftDescriptorAddress", nftDescriptorAddress);
	console.log("wethAddress", wethAddress);

	const linkedBytecode = linkLibraries(
		{
			bytecode: contract.bytecode,
			linkReferences: contract.linkReferences,
		},
		{
			NFTDescriptor: nftDescriptorAddress,
		}
	);

	const NonfungibleTokenPositionDescriptor = await ethers.getContractFactory(
		contract.abi,
		linkedBytecode
	);

	const nativeCurrencyLabelBytes = ethers.encodeBytes32String("POL");

	const nonfungibleTokenPositionDescriptor =
		await NonfungibleTokenPositionDescriptor.deploy(
			wethAddress,
			nativeCurrencyLabelBytes
		);
	await nonfungibleTokenPositionDescriptor.waitForDeployment();
	const deployedAddress =
		await nonfungibleTokenPositionDescriptor.getAddress();

	const data = {
		address: deployedAddress,
		abi: contract.abi,
	};

	fs.writeFileSync(
		"./src/utils/nonfungibleTokenPositionDescriptor.json",
		JSON.stringify(data)
	);

	console.log(
		`NonfungibleTokenPositionDescriptor deployed to: ${deployedAddress}`
	);
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
