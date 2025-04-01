const { ethers } = require("hardhat");
const fs = require("fs");

// const tokens = ["LINK", "WETH", "WMATIC", "DAI", "USDC", "WBTC"];
const tokens = ["WBTC"];

async function deployToken(tokenName) {
	const Token = await ethers.getContractFactory(tokenName);

	const token = await Token.deploy();
	await token.waitForDeployment();
	const deployedAddress = await token.getAddress();

	const data = {
		address: deployedAddress,
		abi: JSON.parse(Token.interface.formatJson()),
	};

	fs.writeFileSync(
		`./src/utils/tokenABI/${tokenName}.json`,
		JSON.stringify(data, null, 2)
	);
    
	console.log(`${tokenName} deployed to: ${deployedAddress}`);
}

async function main() {
	for (const token of tokens) {
		try {
			console.log(`Deploying ${token}`);
			await deployToken(token);
		} catch (error) {
			console.error(`Error deploying ${token}:`, error);
		}
	}
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
